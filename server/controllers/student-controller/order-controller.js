const { paypal, getPayPalConfigError } = require("../../helpers/paypal");
const Order = require("../../models/Order");
const Course = require("../../models/Course");
const StudentCourses = require("../../models/StudentCourses");

function getPayPalErrorMessage(error) {
  const httpStatusCode =
    error?.response?.httpStatusCode ||
    error?.httpStatusCode ||
    error?.response?.response?.statusCode;

  if (Number(httpStatusCode) === 401) {
    return "PayPal unauthorized: invalid client ID/secret, wrong sandbox-live mode, or inactive PayPal app credentials.";
  }

  const details = error?.response?.details;

  if (Array.isArray(details) && details.length > 0) {
    return details
      .map((item) => item.issue || item.field || item.description)
      .filter(Boolean)
      .join(", ");
  }

  return (
    error?.response?.message ||
    error?.message ||
    "Error while creating PayPal payment."
  );
}

const createOrder = async (req, res) => {
  try {
    const {
      userId,
      userName,
      userEmail,
      orderStatus,
      paymentMethod,
      paymentStatus,
      orderDate,
      paymentId,
      payerId,
      instructorId,
      instructorName,
      courseImage,
      courseTitle,
      courseId,
      coursePricing,
    } = req.body;
    const normalizedUserId = String(userId || "").trim();
    const normalizedCourseId = String(courseId || "").trim();
    const normalizedPrice = Number(coursePricing);

    if (!normalizedUserId || !normalizedCourseId) {
      return res.status(400).json({
        success: false,
        message: "User and course are required to enroll",
      });
    }

    if (!Number.isFinite(normalizedPrice) || normalizedPrice < 0) {
      return res.status(400).json({
        success: false,
        message: "Course price is invalid",
      });
    }

    const course = await Course.findById(normalizedCourseId);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    const existingEnrollment = await StudentCourses.findOne({
      userId: normalizedUserId,
      "courses.courseId": normalizedCourseId,
    });

    if (existingEnrollment) {
      return res.status(400).json({
        success: false,
        message: "You are already enrolled in this course",
      });
    }

    const payPalConfigError = getPayPalConfigError();

    if (payPalConfigError) {
      return res.status(500).json({
        success: false,
        message: payPalConfigError,
      });
    }

    const create_payment_json = {
      intent: "sale",
      payer: {
        payment_method: "paypal",
      },
      redirect_urls: {
        return_url: `${process.env.CLIENT_URL}/payment-return`,
        cancel_url: `${process.env.CLIENT_URL}/payment-cancel`,
      },
      transactions: [
        {
          item_list: {
            items: [
              {
                name: courseTitle,
                sku: normalizedCourseId,
                price: normalizedPrice.toFixed(2),
                currency: "USD",
                quantity: 1,
              },
            ],
          },
          amount: {
            currency: "USD",
            total: normalizedPrice.toFixed(2),
          },
          description: courseTitle,
        },
      ],
    };

    paypal.payment.create(create_payment_json, async (error, paymentInfo) => {
      if (error) {
        console.log(error);
        return res.status(500).json({
          success: false,
          message: getPayPalErrorMessage(error),
        });
      } else {
        const approvalLink = paymentInfo.links.find(
          (link) => link.rel === "approval_url"
        );

        if (!approvalLink?.href) {
          return res.status(500).json({
            success: false,
            message: "Could not start PayPal approval",
          });
        }

        const newlyCreatedCourseOrder = new Order({
          userId: normalizedUserId,
          userName,
          userEmail,
          orderStatus,
          paymentMethod,
          paymentStatus,
          orderDate,
          paymentId,
          payerId,
          instructorId,
          instructorName,
          courseImage,
          courseTitle,
          courseId: normalizedCourseId,
          coursePricing: normalizedPrice.toFixed(2),
        });

        await newlyCreatedCourseOrder.save();

        res.status(201).json({
          success: true,
          data: {
            approveUrl: approvalLink.href,
            orderId: newlyCreatedCourseOrder._id,
          },
        });
      }
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: "Some error occured!",
    });
  }
};

const capturePaymentAndFinalizeOrder = async (req, res) => {
  try {
    const { paymentId, payerId, orderId } = req.body;

    let order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order can not be found",
      });
    }

    order.paymentStatus = "paid";
    order.orderStatus = "confirmed";
    order.paymentId = paymentId;
    order.payerId = payerId;

    await order.save();

    //update out student course model
    const studentCourses = await StudentCourses.findOne({
      userId: order.userId,
    });
    const normalizedCourseId = String(order.courseId);

    if (studentCourses) {
      const alreadyExists = studentCourses.courses.some(
        (courseItem) => String(courseItem.courseId) === normalizedCourseId
      );

      if (!alreadyExists) {
        studentCourses.courses.push({
          courseId: normalizedCourseId,
          title: order.courseTitle,
          instructorId: order.instructorId,
          instructorName: order.instructorName,
          dateOfPurchase: order.orderDate,
          courseImage: order.courseImage,
        });
      }

      await studentCourses.save();
    } else {
      const newStudentCourses = new StudentCourses({
        userId: order.userId,
        courses: [
          {
            courseId: normalizedCourseId,
            title: order.courseTitle,
            instructorId: order.instructorId,
            instructorName: order.instructorName,
            dateOfPurchase: order.orderDate,
            courseImage: order.courseImage,
          },
        ],
      });

      await newStudentCourses.save();
    }

    //update the course schema students
    await Course.findByIdAndUpdate(order.courseId, {
      $addToSet: {
        students: {
          studentId: order.userId,
          studentName: order.userName,
          studentEmail: order.userEmail,
          paidAmount: order.coursePricing,
        },
      },
    });

    res.status(200).json({
      success: true,
      message: "Order confirmed",
      data: order,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: "Some error occured!",
    });
  }
};

module.exports = { createOrder, capturePaymentAndFinalizeOrder };

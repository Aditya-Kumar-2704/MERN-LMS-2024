import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { captureAndFinalizePaymentService } from "@/services";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function PaypalPaymentReturnPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const paymentId = params.get("paymentId");
  const payerId = params.get("PayerID");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (paymentId && payerId) {
      async function capturePayment() {
        try {
          const orderId = JSON.parse(sessionStorage.getItem("currentOrderId"));

          if (!orderId) {
            setErrorMessage("Could not find the course order to complete enrollment.");
            return;
          }

          const response = await captureAndFinalizePaymentService(
            paymentId,
            payerId,
            orderId
          );

          if (response?.success) {
            sessionStorage.removeItem("currentOrderId");
            window.location.href = "/student-courses";
          } else {
            setErrorMessage(response?.message || "Could not complete enrollment.");
          }
        } catch (error) {
          console.error("Payment capture error:", error);
          setErrorMessage(
            error?.response?.data?.message || "Could not complete enrollment."
          );
        }
      }

      capturePayment();
    } else {
      setErrorMessage("Payment information is missing. Please try enrolling again.");
    }
  }, [payerId, paymentId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {errorMessage || "Processing payment... Please wait"}
        </CardTitle>
        {errorMessage ? (
          <Button className="mt-4" onClick={() => navigate("/courses")}>
            Back to Courses
          </Button>
        ) : null}
      </CardHeader>
    </Card>
  );
}

export default PaypalPaymentReturnPage;

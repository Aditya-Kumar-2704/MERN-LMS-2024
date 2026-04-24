import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import FormControls from "./form-controls";

function CommonForm({
  handleSubmit,
  buttonText,
  formControls = [],
  formData,
  setFormData,
  isButtonDisabled = false,
  formClassName,
  fieldsContainerClassName,
  fieldWrapperClassName,
  labelClassName,
  inputClassName,
  selectTriggerClassName,
  selectContentClassName,
  textareaClassName,
  submitButtonClassName,
}) {
  return (
    <form onSubmit={handleSubmit} className={formClassName}>
      {/* render form controls here */}
      <FormControls
        formControls={formControls}
        formData={formData}
        setFormData={setFormData}
        fieldsContainerClassName={fieldsContainerClassName}
        fieldWrapperClassName={fieldWrapperClassName}
        labelClassName={labelClassName}
        inputClassName={inputClassName}
        selectTriggerClassName={selectTriggerClassName}
        selectContentClassName={selectContentClassName}
        textareaClassName={textareaClassName}
      />
      <Button
        disabled={isButtonDisabled}
        type="submit"
        className={cn("mt-5 w-full", submitButtonClassName)}
      >
        {buttonText || "Submit"}
      </Button>
    </form>
  );
}

export default CommonForm;

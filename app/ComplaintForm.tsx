import { FormEvent, useState } from "react";
import {
  FieldErrors,
  validateFullName,
  validateMinimumText,
  validatePhone,
  validateRequired,
} from "./form-validation";
import { managementContacts } from "./contact-data";
import { ErrorMessage, PreparedRequest, usePreparedRequest } from "./request-form-shared";

export function ComplaintForm() {
  const [errors, setErrors] = useState<FieldErrors>({});
  const prepared = usePreparedRequest();

  const updateFieldError = (field: string, message: string) => {
    setErrors((current) =>
      field in current ? { ...current, [field]: message } : current,
    );
  };

  const validateChangedField = (
    element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
    form: HTMLFormElement,
  ) => {
    switch (element.name) {
      case "fullName":
        updateFieldError("fullName", validateFullName(element.value));
        break;
      case "phone":
        updateFieldError("phone", validatePhone(element.value));
        break;
      case "subject":
        updateFieldError("subject", validateRequired(element.value, "موضوع"));
        break;
      case "description":
        updateFieldError(
          "description",
          validateMinimumText(element.value, "شرح موضوع", 20),
        );
        break;
      case "requestType":
      case "reference": {
        const formData = new FormData(form);
        const requestType = String(formData.get("requestType") ?? "");
        const reference = String(formData.get("reference") ?? "");
        updateFieldError(
          "reference",
          requestType === "پیگیری شکایت" && !reference.trim()
            ? "برای پیگیری، کد یا مرجع قبلی را وارد کنید."
            : "",
        );
        break;
      }
    }
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const requestType = String(form.get("requestType") ?? "ثبت شکایت جدید");
    const fullName = String(form.get("fullName") ?? "");
    const phone = String(form.get("phone") ?? "");
    const reference = String(form.get("reference") ?? "");
    const subject = String(form.get("subject") ?? "");
    const description = String(form.get("description") ?? "");

    const nextErrors: FieldErrors = {
      fullName: validateFullName(fullName),
      phone: validatePhone(phone),
      reference:
        requestType === "پیگیری شکایت" && !reference.trim()
          ? "برای پیگیری، کد یا مرجع قبلی را وارد کنید."
          : "",
      subject: validateRequired(subject, "موضوع"),
      description: validateMinimumText(description, "شرح موضوع", 20),
    };

    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) {
      const firstErrorField = Object.entries(nextErrors).find(
        ([, message]) => Boolean(message),
      )?.[0];
      const firstInvalid = firstErrorField
        ? event.currentTarget.elements.namedItem(firstErrorField)
        : null;
      if (firstInvalid instanceof HTMLElement) firstInvalid.focus();
      return;
    }

    prepared.prepare(
      [
        requestType,
        `نام: ${fullName.trim()}`,
        `شماره تماس: ${phone.trim()}`,
        `کد یا مرجع قبلی: ${reference.trim() || "ندارد"}`,
        `موضوع: ${subject.trim()}`,
        `شرح: ${description.trim()}`,
      ].join("\n"),
    );
  };

  return (
    <form
      className="request-form"
      id="complaint-form"
      noValidate
      onSubmit={submit}
      onChange={(event) => {
        const element = event.target;
        if (
          element instanceof HTMLInputElement ||
          element instanceof HTMLSelectElement ||
          element instanceof HTMLTextAreaElement
        ) {
          validateChangedField(element, event.currentTarget);
        }
      }}
    >
      <div className="form-heading">
        <span>ثبت و پیگیری</span>
        <h2>آماده‌سازی متن شکایت یا درخواست پیگیری</h2>
        <p>
          تا پیش از اعلام ایمیل رسمی یا سامانه ثبت، این فرم فقط متن شما را
          آماده می‌کند. ثبت نهایی از طریق تماس با مدیریت انجام می‌شود.
        </p>
      </div>
      <div className="form-grid">
        <label>
          نوع درخواست
          <select name="requestType">
            <option>ثبت شکایت جدید</option>
            <option>پیگیری شکایت</option>
          </select>
        </label>
        <label>
          نام و نام خانوادگی
          <input
            name="fullName"
            autoComplete="name"
            aria-invalid={Boolean(errors.fullName)}
            aria-describedby={
              errors.fullName ? "complaint-name-error" : undefined
            }
          />
          <ErrorMessage id="complaint-name-error" message={errors.fullName} />
        </label>
        <label>
          شماره تماس
          <input
            name="phone"
            type="tel"
            dir="ltr"
            inputMode="tel"
            autoComplete="tel"
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={
              errors.phone ? "complaint-phone-error" : undefined
            }
          />
          <ErrorMessage id="complaint-phone-error" message={errors.phone} />
        </label>
        <label>
          کد یا مرجع قبلی
          <input
            name="reference"
            dir="ltr"
            aria-invalid={Boolean(errors.reference)}
            aria-describedby={
              errors.reference ? "complaint-reference-error" : undefined
            }
          />
          <ErrorMessage
            id="complaint-reference-error"
            message={errors.reference}
          />
        </label>
        <label className="form-wide">
          موضوع
          <input
            name="subject"
            aria-invalid={Boolean(errors.subject)}
            aria-describedby={
              errors.subject ? "complaint-subject-error" : undefined
            }
          />
          <ErrorMessage id="complaint-subject-error" message={errors.subject} />
        </label>
        <label className="form-wide">
          شرح موضوع
          <textarea
            name="description"
            rows={6}
            maxLength={2000}
            aria-invalid={Boolean(errors.description)}
            aria-describedby={
              errors.description ? "complaint-description-error" : undefined
            }
          />
          <ErrorMessage
            id="complaint-description-error"
            message={errors.description}
          />
        </label>
      </div>
      <button className="form-submit" type="submit">
        بررسی و آماده‌سازی متن
      </button>
      <PreparedRequest
        title="پیش‌نویس شکایت یا پیگیری"
        preparedText={prepared.preparedText}
        copyMessage={prepared.copyMessage}
        resultRef={prepared.resultRef}
        onCopy={prepared.copy}
        contactLabel="تماس با مدیریت"
        contactHref={managementContacts[0].href}
      />
    </form>
  );
}

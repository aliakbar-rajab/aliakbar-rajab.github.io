import { useRef, useState } from "react";
import { phones } from "./contact-data";
import { siteConfig } from "./site-config";

export function ErrorMessage({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <span className="field-error" id={id} role="alert">
      {message}
    </span>
  );
}

export function usePreparedRequest() {
  const [preparedText, setPreparedText] = useState("");
  const [copyMessage, setCopyMessage] = useState("");
  const resultRef = useRef<HTMLDivElement>(null);

  const prepare = (text: string) => {
    setPreparedText(text);
    setCopyMessage("");
    window.requestAnimationFrame(() => resultRef.current?.focus());
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(preparedText);
      setCopyMessage("متن درخواست کپی شد.");
    } catch {
      setCopyMessage(
        "کپی خودکار ممکن نشد؛ متن را انتخاب و به‌صورت دستی کپی کنید.",
      );
    }
  };

  const clear = () => {
    setPreparedText("");
    setCopyMessage("");
  };

  return { preparedText, copyMessage, resultRef, prepare, copy, clear };
}

export function PreparedRequest({
  title,
  preparedText,
  copyMessage,
  resultRef,
  onCopy,
}: {
  title: string;
  preparedText: string;
  copyMessage: string;
  resultRef: React.RefObject<HTMLDivElement | null>;
  onCopy: () => void;
}) {
  if (!preparedText) return null;

  return (
    <div className="prepared-request" ref={resultRef} tabIndex={-1}>
      <h3>{title}</h3>
      <p>
        این متن هنوز برای واحد فروش یا مدیریت ارسال نشده است. آن را کپی کنید و
        هنگام تماس در اختیار پاسخ‌گو بگذارید.
      </p>
      <textarea readOnly value={preparedText} aria-label="متن آماده‌شده درخواست" />
      <div className="prepared-actions">
        <button type="button" onClick={onCopy}>
          کپی متن درخواست
        </button>
        <a href={phones[0].href}>تماس با واحد فروش</a>
        {siteConfig.contact.officialEmail ? (
          <a
            href={`mailto:${siteConfig.contact.officialEmail}?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(preparedText)}`}
          >
            ارسال با ایمیل رسمی
          </a>
        ) : null}
      </div>
      <p className="copy-status" role="status" aria-live="polite">
        {copyMessage}
      </p>
    </div>
  );
}

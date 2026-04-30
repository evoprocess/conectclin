export default function ErrorMessage({ message }) {
  if (!message) return null;
  return (
    <div className="error-message-custom">
      <i className="bi bi-exclamation-triangle-fill"></i>
      <span>{message}</span>
    </div>
  );
}
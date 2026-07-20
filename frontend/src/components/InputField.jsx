export default function InputField({ placeholder, type = "text" }) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      className="w-full border rounded-xl p-4"
    />
  )
}
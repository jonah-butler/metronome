import '../css/TextInput.css';

type NumberInputProps = {
  text: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export default function TextInput({
  text,
  onChange,
  placeholder,
}: NumberInputProps) {
  return (
    <>
      <input
        placeholder={placeholder}
        className="input-text"
        type="text"
        value={text}
        onChange={(e) => onChange(e.target.value)}
      />
    </>
  );
}

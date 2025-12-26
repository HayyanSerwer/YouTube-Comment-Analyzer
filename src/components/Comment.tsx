interface CommentProps {
  text: string;
  number: number;
}

export default function Comment({ text, number }: CommentProps) {
  return (
    <li className="mb-4 p-3 bg-gray-700 rounded-md text-white">
      User {number}: {text}
    </li>
  );
}

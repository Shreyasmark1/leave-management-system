import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SubmitButtonProps extends React.ComponentProps<typeof Button> {
  loading?: boolean;
}

export function SubmitButton({ children, loading, disabled, ...props }: SubmitButtonProps) {
  return (
    <Button type="submit" disabled={disabled || loading} {...props}>
      {loading && <Loader2 className="animate-spin" />}
      {children}
    </Button>
  );
}
import type { AuthFormProps } from '@/features/auth/view/AuthForm/AuthForm.typedefs';
import styles from '@/features/auth/view/AuthForm/AuthForm.module.scss';

export function AuthForm({ onSubmit, children }: AuthFormProps) {
  return (
    <form
      noValidate
      className={styles.root}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      {children}
    </form>
  );
}

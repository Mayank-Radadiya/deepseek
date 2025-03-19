interface layoutProps {
  children: React.ReactNode;
}

const authLayout = ({ children }: layoutProps) => {
  return (
    <>
      <main className="h-full w-full flex items-center justify-center">
        <section>{children}</section>
      </main>
    </>
  );
};

export default authLayout;

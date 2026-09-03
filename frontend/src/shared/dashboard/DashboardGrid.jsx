export default function DashboardGrid({
  children,
  className = "",
}) {

  return (

    <div
      className={`
        grid
        grid-cols-12
        gap-6
        ${className}
      `}
    >

      {children}

    </div>

  );

}
import '../../css/Drawer.css';

type DrawerProps = {
  isOpen: boolean;
  children: React.ReactNode;
  height?: number;
  handleClose(): void;
};

export function Drawer({ children, isOpen, height, handleClose }: DrawerProps) {
  height = height ? height : 500;

  return (
    <section className={`drawer__container ${isOpen ? 'open' : undefined}`}>
      <section
        style={isOpen ? { height } : undefined}
        className={`${isOpen ? 'open' : undefined} drawer`}
      >
        <div onClick={handleClose} className="drawer__close">
          &times;
        </div>

        <div className="drawer__contents"> {children}</div>
      </section>
    </section>
  );
}

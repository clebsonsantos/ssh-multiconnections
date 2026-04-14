// CSS imports (plain and modules)
declare module "*.css";
declare module "*.module.css" {
  const styles: { [className: string]: string };
  export default styles;
}

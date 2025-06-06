declare module "vue-material-design-icons/*.vue" {
  import type { DefineComponent } from "vue";

  const IconVue: DefineComponent<
    Partial<{
      /// `size` defaults to 24
      size: number;
      /// `fillColor` defaults to 'currentColor'
      fillColor: string;
      title?: string;
    }>
  >;
  export default IconVue;
}

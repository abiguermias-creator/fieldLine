let navigateFunction: ((path: string) => void) | null = null;

export function setNavigate(nav: (path: string) => void) {
  navigateFunction = nav;
}

export function goTo(path: string) {
  if (navigateFunction) {
    navigateFunction(path);
  }
}
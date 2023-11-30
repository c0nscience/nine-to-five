export type Route = {
  path: string
  component?: any
  // @ts-ignore
  middleware?: PageJS.Callback[]
  params?: any
}

export type Route = {
  path: string
  component?: any
  middleware?: PageJS.Callback[]
  params?: any
}

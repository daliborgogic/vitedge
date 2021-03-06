import viteSSR from 'vite-ssr/entry-client'
import { addPagePropsGetterToRoutes, buildPropsRoute } from './utils/router'

export default function (App, { routes, pageProps = true }, hook) {
  if (pageProps) {
    addPagePropsGetterToRoutes(routes)
  }

  return viteSSR(App, { routes }, async ({ app, router, initialState }) => {
    let isFirstRoute = true

    router.beforeEach(async (to, from, next) => {
      if (isFirstRoute) {
        isFirstRoute = false
        if (process.env.NODE_ENV !== 'development' && to.meta.state) {
          // Do not get props the first time for the entry
          // route since it is already rendered in the server.
          return next()
        }
      }

      const propsRoute = buildPropsRoute(to)

      if (propsRoute) {
        try {
          const res = await fetch(propsRoute.fullPath, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          })

          to.meta.state = await res.json()
        } catch (error) {
          console.error(error)
          // redirect to error route
        }
      }

      next()
    })

    if (hook) {
      await hook({ app, router, isClient: true, initialState })
    }
  })
}

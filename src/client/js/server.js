import 'babel-polyfill'
import {app, router} from './vue'

export default (context) => {
  return new Promise((resolve, reject) => {
    router.push(context.url)

    router.onReady(() => {
      const matchedComponents = router.getMatchedComponents()

      matchedComponents.forEach((component) => {
        if (component.errorStatus) {
          return reject({
            'code': component.errorStatus
          })
        }
      })

      resolve(app)
    })
  })
}

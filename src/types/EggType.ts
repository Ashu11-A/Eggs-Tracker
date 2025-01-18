export interface EggConfig {
  meta: {
    version: string
    update_url: null
  }
  exported_at: string
  name: string
  author: string
  description: string
  features: null
  docker_images: {
    [key: string]: string
  }
  file_denylist: string[]
  startup: string
  config: {
    files: {
      [key: string]: {
        parser: string
        find: {
          [key: string]: string
        }
      }
    }
    startup: {
      done: string
      userInteraction: unknown[]
    }
    logs: {
      custom: boolean
      location: string
    }
    stop: string
  }
  scripts: {
    installation: {
      script: string
      container: string
      entrypoint: string
    }
  }
  variables: Variable[]
}

interface Variable {
  name: string
  description: string
  env_variable: string
  default_value: string
  user_viewable: boolean
  user_editable: boolean
  rules: string
  field_type: string
}
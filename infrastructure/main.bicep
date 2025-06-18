// Azure Container Apps infrastructure template
param environmentName string = 'vinod-electronics-env'
param containerAppName string = 'vinod-electronics'
param location string = resourceGroup().location
param containerRegistryName string = 'vinodelectronics'
param minReplicas int = 1
param maxReplicas int = 10

// Environment for staging or production
param environment string = 'production'

// Container image
param containerImage string = '${containerRegistryName}.azurecr.io/vinod-electronics-app:latest'

// Environment-specific settings
var environmentSettings = {
  staging: {
    minReplicas: 1
    maxReplicas: 3
    cpu: '0.5'
    memory: '1Gi'
    suffix: '-staging'
  }
  production: {
    minReplicas: 2
    maxReplicas: 10
    cpu: '1.0'
    memory: '2Gi'
    suffix: ''
  }
}

var settings = environmentSettings[environment]

// Container Registry (if not exists)
resource containerRegistry 'Microsoft.ContainerRegistry/registries@2023-01-01-preview' = {
  name: containerRegistryName
  location: location
  sku: {
    name: 'Basic'
  }
  properties: {
    adminUserEnabled: true
  }
}

// Log Analytics Workspace
resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: '${environmentName}-logs'
  location: location
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
  }
}

// Container Apps Environment
resource containerAppsEnvironment 'Microsoft.App/managedEnvironments@2023-05-01' = {
  name: '${environmentName}${settings.suffix}'
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalytics.properties.customerId
        sharedKey: logAnalytics.listKeys().primarySharedKey
      }
    }
  }
}

// Container App
resource containerApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: '${containerAppName}${settings.suffix}'
  location: location
  properties: {
    managedEnvironmentId: containerAppsEnvironment.id
    configuration: {
      activeRevisionsMode: 'Single'
      ingress: {
        external: true
        targetPort: 5001
        allowInsecure: false
        traffic: [
          {
            weight: 100
            latestRevision: true
          }
        ]
      }
      registries: [
        {
          server: '${containerRegistryName}.azurecr.io'
          username: containerRegistry.listCredentials().username
          passwordSecretRef: 'acr-password'
        }
      ]
      secrets: [
        {
          name: 'acr-password'
          value: containerRegistry.listCredentials().passwords[0].value
        }
        {
          name: 'jwt-secret'
          value: environment == 'production' ? 'CHANGE-THIS-IN-PRODUCTION-TO-SECURE-256-BIT-KEY' : 'staging-jwt-secret-key'
        }
      ]
    }
    template: {
      containers: [
        {
          image: containerImage
          name: 'vinod-electronics-app'
          env: [
            {
              name: 'NODE_ENV'
              value: environment
            }
            {
              name: 'PORT'
              value: '5001'
            }
            {
              name: 'JWT_SECRET'
              secretRef: 'jwt-secret'
            }
            {
              name: 'CACHE_TTL'
              value: '3600000'
            }
            {
              name: 'DATA_REFRESH_INTERVAL'
              value: '86400000'
            }
            {
              name: 'RATE_LIMIT_WINDOW_MS'
              value: '900000'
            }
            {
              name: 'RATE_LIMIT_MAX_REQUESTS'
              value: environment == 'production' ? '150' : '100'
            }
            {
              name: 'ALLOWED_ORIGINS'
              value: 'https://${containerAppName}${settings.suffix}.${containerAppsEnvironment.properties.defaultDomain}'
            }
          ]
          resources: {
            cpu: json(settings.cpu)
            memory: settings.memory
          }
          probes: [
            {
              type: 'Liveness'
              httpGet: {
                path: '/health'
                port: 5001
              }
              initialDelaySeconds: 30
              periodSeconds: 30
            }
            {
              type: 'Readiness'
              httpGet: {
                path: '/health'
                port: 5001
              }
              initialDelaySeconds: 5
              periodSeconds: 10
            }
          ]
        }
      ]
      scale: {
        minReplicas: settings.minReplicas
        maxReplicas: settings.maxReplicas
        rules: [
          {
            name: 'http-scaler'
            http: {
              metadata: {
                concurrentRequests: '30'
              }
            }
          }
          {
            name: 'cpu-scaler'
            custom: {
              type: 'cpu'
              metadata: {
                type: 'Utilization'
                value: '70'
              }
            }
          }
        ]
      }
    }
  }
}

// Outputs
output containerAppUrl string = 'https://${containerApp.properties.configuration.ingress.fqdn}'
output containerRegistryLoginServer string = containerRegistry.properties.loginServer
output containerAppsEnvironmentId string = containerAppsEnvironment.id

targetScope = 'resourceGroup'

@description('Azure region')
param location string = 'northeurope'

@description('Environment name')
param environment string = 'production'

var projectName = 'golazo'
var tags = {
  project: projectName
  environment: environment
  managedBy: 'bicep'
}

resource staticWebApp 'Microsoft.Web/staticSites@2023-12-01' = {
  name: '${projectName}-swa'
  location: 'westeurope' // SWA not available in northeurope
  tags: tags
  sku: {
    name: 'Free'
    tier: 'Free'
  }
  properties: {
    stagingEnvironmentPolicy: 'Enabled'
    allowConfigFileUpdates: true
    buildProperties: {
      skipGithubActionWorkflowGeneration: true
    }
  }
}

resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: '${projectName}-law'
  location: location
  tags: tags
  properties: {
    sku: { name: 'PerGB2018' }
    retentionInDays: 30
    workspaceCapping: { dailyQuotaGb: json('0.1') }
  }
}

resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: '${projectName}-ai'
  location: location
  kind: 'web'
  tags: tags
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalytics.id
  }
}

// ── Cosmos DB (Free tier — 1000 RU/s, 25 GB) ──
resource cosmosAccount 'Microsoft.DocumentDB/databaseAccounts@2024-05-15' = {
  name: '${projectName}-cosmos'
  location: location
  tags: tags
  kind: 'GlobalDocumentDB'
  properties: {
    databaseAccountOfferType: 'Standard'
    enableFreeTier: true
    consistencyPolicy: {
      defaultConsistencyLevel: 'Session'
    }
    locations: [
      {
        locationName: location
        failoverPriority: 0
      }
    ]
    capabilities: [
      { name: 'EnableServerless' }
    ]
  }
}

resource cosmosDatabase 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases@2024-05-15' = {
  parent: cosmosAccount
  name: projectName
  properties: {
    resource: {
      id: projectName
    }
  }
}

resource cosmosContainer 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2024-05-15' = {
  parent: cosmosDatabase
  name: projectName
  properties: {
    resource: {
      id: projectName
      partitionKey: {
        paths: ['/userId']
        kind: 'Hash'
      }
      indexingPolicy: {
        indexingMode: 'consistent'
        automatic: true
        includedPaths: [
          { path: '/docType/?' }
          { path: '/userId/?' }
        ]
        excludedPaths: [
          { path: '/data/*' }
          { path: '/*' }
        ]
      }
    }
  }
}

// ── Shared Teams Registry container ──
resource teamsContainer 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2024-05-15' = {
  parent: cosmosDatabase
  name: 'teams'
  properties: {
    resource: {
      id: 'teams'
      partitionKey: {
        paths: ['/country']
        kind: 'Hash'
      }
      indexingPolicy: {
        indexingMode: 'consistent'
        automatic: true
        includedPaths: [
          { path: '/country/?' }
          { path: '/name/?' }
          { path: '/verified/?' }
        ]
        excludedPaths: [
          { path: '/aliases/*' }
          { path: '/socialMedia/*' }
          { path: '/*' }
        ]
      }
    }
  }
}

// ── SWA app settings (link Cosmos) ──
resource swaAppSettings 'Microsoft.Web/staticSites/config@2023-12-01' = {
  parent: staticWebApp
  name: 'appsettings'
  properties: {
    COSMOS_ENDPOINT: cosmosAccount.properties.documentEndpoint
    COSMOS_DATABASE: projectName
    COSMOS_CONTAINER: projectName
  }
}

output swaDefaultHostname string = staticWebApp.properties.defaultHostname
output swaName string = staticWebApp.name
output appInsightsConnectionString string = appInsights.properties.ConnectionString
output cosmosEndpoint string = cosmosAccount.properties.documentEndpoint

#!/bin/bash

# Azure Container Apps Deployment Script
# This script deploys the Vinod Electronics Search app to Azure Container Apps

set -e

# Configuration
RESOURCE_GROUP="rg-vinod-electronics"
LOCATION="East US"
SUBSCRIPTION_ID=${AZURE_SUBSCRIPTION_ID}
ENVIRONMENT=${1:-"production"}  # production or staging

echo "🚀 Deploying to Azure Container Apps"
echo "📋 Environment: $ENVIRONMENT"
echo "📍 Location: $LOCATION"
echo "📦 Resource Group: $RESOURCE_GROUP"

# Check if logged in to Azure
if ! az account show > /dev/null 2>&1; then
    echo "❌ Please log in to Azure first: az login"
    exit 1
fi

# Set subscription if provided
if [ ! -z "$SUBSCRIPTION_ID" ]; then
    echo "🔧 Setting subscription: $SUBSCRIPTION_ID"
    az account set --subscription "$SUBSCRIPTION_ID"
fi

# Create resource group if it doesn't exist
echo "📦 Creating resource group..."
az group create \
    --name "$RESOURCE_GROUP" \
    --location "$LOCATION" \
    --output table

# Deploy infrastructure
echo "🏗️ Deploying infrastructure..."
if [ "$ENVIRONMENT" = "staging" ]; then
    PARAMETERS_FILE="infrastructure/staging.parameters.json"
else
    PARAMETERS_FILE="infrastructure/main.parameters.json"
fi

az deployment group create \
    --resource-group "$RESOURCE_GROUP" \
    --template-file "infrastructure/main.bicep" \
    --parameters "@$PARAMETERS_FILE" \
    --output table

# Get container registry credentials
echo "🔐 Getting container registry credentials..."
ACR_NAME="vinodelectronics"
ACR_USERNAME=$(az acr credential show --name "$ACR_NAME" --query "username" -o tsv)
ACR_PASSWORD=$(az acr credential show --name "$ACR_NAME" --query "passwords[0].value" -o tsv)

echo "✅ Container Registry Credentials:"
echo "   Username: $ACR_USERNAME"
echo "   Password: [HIDDEN]"

# Build and push container image
echo "🐳 Building and pushing container image..."
CONTAINER_NAME="vinod-electronics-app"
IMAGE_TAG="$(date +%Y%m%d%H%M%S)"

# Login to ACR
az acr login --name "$ACR_NAME"

# Build and push
docker build -t "$ACR_NAME.azurecr.io/$CONTAINER_NAME:$IMAGE_TAG" .
docker build -t "$ACR_NAME.azurecr.io/$CONTAINER_NAME:latest" .

docker push "$ACR_NAME.azurecr.io/$CONTAINER_NAME:$IMAGE_TAG"
docker push "$ACR_NAME.azurecr.io/$CONTAINER_NAME:latest"

# Update container app with new image
echo "🚀 Updating container app..."
if [ "$ENVIRONMENT" = "staging" ]; then
    CONTAINER_APP_NAME="vinod-electronics-staging"
else
    CONTAINER_APP_NAME="vinod-electronics"
fi

az containerapp update \
    --name "$CONTAINER_APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --image "$ACR_NAME.azurecr.io/$CONTAINER_NAME:$IMAGE_TAG" \
    --output table

# Get the application URL
APP_URL=$(az containerapp show \
    --name "$CONTAINER_APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query "properties.configuration.ingress.fqdn" -o tsv)

echo ""
echo "✅ Deployment completed successfully!"
echo "🌐 Application URL: https://$APP_URL"
echo "📊 Health Check: https://$APP_URL/health"
echo ""

# Run basic health check
echo "🧪 Running health check..."
if curl -f "https://$APP_URL/health" > /dev/null 2>&1; then
    echo "✅ Health check passed!"
else
    echo "❌ Health check failed!"
    exit 1
fi

echo ""
echo "🎉 Deployment completed successfully!"
echo "📱 Access your application at: https://$APP_URL"

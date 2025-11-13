# Diagrammes d'Architecture - Fraud Detection System

Ce dossier contient les diagrammes d'architecture du projet de détection de fraude.

## Fichiers Disponibles

### 1. `ARCHITECTURE_DIAGRAM.eraser`
Diagramme avec syntaxe Mermaid (compatible Eraser)
- Format: Mermaid graph
- Visualisation: Diagramme de flux complet
- Inclut: Tous les composants et flux de données numérotés

### 2. `ARCHITECTURE_ERASER.eraser`
Diagramme avec syntaxe Eraser native
- Format: Syntaxe Eraser standard
- Visualisation: Diagramme de système logiciel
- Inclut: Composants, systèmes et relations

## Comment Utiliser

### Option 1: Eraser.io (Recommandé)

1. **Ouvrir Eraser.io**
   - Aller sur https://eraser.io
   - Créer un nouveau document

2. **Importer le fichier**
   - Copier le contenu de `ARCHITECTURE_ERASER.eraser`
   - Coller dans Eraser
   - Le diagramme sera généré automatiquement

3. **Ou utiliser Mermaid**
   - Copier le contenu de `ARCHITECTURE_DIAGRAM.eraser`
   - Coller dans Eraser (supporte Mermaid)

### Option 2: Mermaid Live Editor

1. **Ouvrir Mermaid Live**
   - Aller sur https://mermaid.live
   
2. **Copier le code Mermaid**
   - Ouvrir `ARCHITECTURE_DIAGRAM.eraser`
   - Copier le bloc de code entre ` ```mermaid ` et ` ``` `
   
3. **Coller dans Mermaid Live**
   - Le diagramme sera généré automatiquement
   - Vous pouvez exporter en PNG/SVG

### Option 3: VS Code avec Extension Mermaid

1. **Installer l'extension**
   - Extension: "Markdown Preview Mermaid Support"
   
2. **Ouvrir le fichier**
   - Ouvrir `ARCHITECTURE_DIAGRAM.eraser` dans VS Code
   - Prévisualiser avec Mermaid

## Architecture Complète

```
┌─────────────────┐
│   Utilisateur   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   React UI      │◄──┐
│  (Frontend)     │   │
└────────┬────────┘   │
         │            │
         ▼            │
┌─────────────────┐   │
│  AWS Amplify    │   │
│  (Hosting)      │   │
└────────┬────────┘   │
         │            │
         ▼            │
┌─────────────────┐   │
│ Lambda Function │   │
│     URL         │   │
│  (HTTPS Proxy)  │   │
└────────┬────────┘   │
         │            │
         ▼            │
┌─────────────────┐   │
│ Lambda Function │   │
│  (Node.js Proxy)│   │
└────────┬────────┘   │
         │            │
         ▼            │
┌─────────────────┐   │
│ Node.js/Express │   │
│   (Backend)     │   │
└────────┬────────┘   │
         │            │
         ├────────────┘
         │
         ▼
┌─────────────────┐
│ Elastic         │
│ Beanstalk       │
│  (EC2 Hosting)  │
└─────────────────┘

┌─────────────────┐
│  SageMaker      │
│   Endpoint      │
│  (ML Inference) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    ML Model     │
│ (Fraud Detection)│
└─────────────────┘

┌─────────────────┐
│  CloudWatch     │
│ (Metrics/Logs)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Grafana Cloud  │
│  (Dashboards)   │
└─────────────────┘
```

## Composants Détaillés

### Frontend
- **React UI**: Interface utilisateur avec Tailwind CSS
- **AWS Amplify**: Déploiement et hébergement automatique

### Proxy
- **Lambda Function URL**: Point d'entrée HTTPS
- **Lambda Function**: Proxy serverless Node.js

### Backend
- **Node.js/Express**: API REST `/api/predict`
- **Elastic Beanstalk**: Hébergement sur EC2

### Machine Learning
- **SageMaker Endpoint**: Endpoint de prédiction
- **ML Model**: Modèle de détection de fraude

### Monitoring
- **CloudWatch**: Métriques et logs AWS
- **Grafana Cloud**: Visualisation en temps réel

## Flux de Données

1. **Requête**: Utilisateur → React → Amplify → Lambda URL → Lambda → Backend → SageMaker → ML Model
2. **Réponse**: ML Model → SageMaker → Backend → Lambda → Lambda URL → React → Utilisateur
3. **Monitoring**: Backend/Lambda → CloudWatch → Grafana

## Métriques Surveillées

- **PredictionCount**: Nombre de prédictions (Fraud/Legitimate)
- **ConfidenceScore**: Score de confiance moyen
- **ResponseTime**: Temps de réponse API
- **ErrorCount**: Nombre d'erreurs
- **Lambda Metrics**: Invocations, Duration, Errors

## Technologies

- **Frontend**: React 19, Tailwind CSS
- **Backend**: Node.js, Express, AWS SDK
- **Proxy**: AWS Lambda (Node.js 20.x)
- **Hosting**: AWS Amplify, Elastic Beanstalk
- **ML**: AWS SageMaker
- **Monitoring**: CloudWatch, Grafana Cloud


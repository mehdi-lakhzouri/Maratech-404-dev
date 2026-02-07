# ANALYSE APPROFONDIE DU PROJET : TILI – Internal Management Platform

> **Document de Référence pour l'équipe technique**
> **Date :** 06 Février 2026
> **Statut :** Analyse Détaillée

---

## 1. EXPLICATION SIMPLE DU PROJET

L'association **TILI (Tunisia Inclusive Labor Institute)** effectue un travail social crucial auprès de 5000 bénéficiaires, mais sa gestion interne est chaotique. Actuellement, l'information est dispersée entre des Google Drive, des emails et des fichiers locaux, ce qui crée des silos, des pertes de données et une inefficacité chronique.

**Le Projet :** Construire une **application web centralisée** qui servira de "colonne vertébrale" numérique à l'association.
Ce n'est pas un simple stockage de fichiers. C'est un espace de travail où :

1.  Les documents sont rangés intelligemment.
2.  Les réunions sont préparées et suivies (comptes-rendus liés).
3.  L'activité des projets est tracée.

L'objectif est de passer d'une gestion artisanale à une gestion structurée et pérenne.

---

## 2. OBJECTIFS ET UTILISATEURS

### Objectif Principal (La Problématique Résolue)

**Problème :** Dispersion des documents, manque de traçabilité, collaboration difficile.
**Solution :** Une plateforme unique pour centraliser, hiérarchiser et sécuriser l'information interne.
**Bénéfice Attendu :** Gain de temps, fin des doublons, pérennité de la mémoire de l'association.

### Utilisateurs Cibles & Parties Prenantes

#### A. Les Responsables (Direction/Admin)

- **Profil :** Décideurs, besoin de vision macro.
- **Besoin :** Piloter l'association, gérer les accès, s'assurer que les projets avancent.
- **Droit :** Accès Admin complet (SuperUser).

#### B. Les Chefs de Projets (Managers)

- **Profil :** Organisateurs, pivots de l'action.
- **Besoin :** Organiser les réunions, structurer les dossiers de projet, rédiger les comptes-rendus.
- **Droit :** Accès en écriture sur leurs projets/réunions.

#### C. Les Consultants et Membres Actifs (Opérationnels)

- **Profil :** Terrain, production de livrables.
- **Besoin :** Accéder rapidement aux infos pour travailler, déposer leurs rapports sans se poser de questions.
- **Droit :** Accès en lecture (sur les ressources) et écriture (dépôt de leurs propres documents).

---

## 3. WORKFLOWS DE L'APPLICATION

### A. Workflow Global du Système

1.  **Connexion Sécurisée :** L'utilisateur s'identifie (Email/Mot de passe).
2.  **Routage Intelligent :** Redirection vers un tableau de bord adapté à son rôle (Vue Pilote vs Vue Opérationnelle).
3.  **Navigation Contextuelle :** L'utilisateur entre dans un contexte (ex: "Projet Alpha" ou "Réunion Hebdo").
4.  **Action Métier :**
    - _Upload_ d'un document.
    - _Rédaction_ d'un compte-rendu.
    - _Planification_ d'un événement.
5.  **Liaison Automatique :** Le système tisse des liens : Ce document -> appartient à cette Réunion -> qui appartient à ce Projet.

### B. Workflow Détaillé par Type d’Utilisateur

#### Scénario 1 : Le Chef de Projet (Cycle d'une réunion)

1.  Se connecte au Dashboard.
2.  Clic sur "Nouvelle Réunion".
3.  Remplit les détails (Date, Lieu, Ordre du jour, Participants).
4.  Le système génère la fiche réunion.
5.  Pendant la réunion : Ouvre la fiche, saisit le Compte-Rendu en direct.
6.  Fin de réunion : Clôture le CR, upload la feuille de présence scannée.
7.  Résultat : La réunion et ses docs sont archivés et accessibles aux participants.

#### Scénario 2 : Le Consultant (Cycle de dépôt)

1.  Reçoit une tâche ou doit rendre un rapport.
2.  Se connecte.
3.  Va dans le module "Documents" ou le "Projet" concerné.
4.  Clic sur "Déposer un fichier".
5.  Sélectionne son rapport PDF et le qualifie (Type: "Rapport", Date: "Aujourd'hui").
6.  Le système confirme le dépôt et notifie (idéalement) le chef de projet.

#### Scénario 3 : Le Responsable (Cycle d'Audit)

1.  Veut vérifier l'avancement du Projet X.
2.  Consulte le Dashboard général.
3.  Filtre par "Projet X".
4.  Voit la liste des dernières réunions et les derniers documents ajoutés.
5.  Ouvre le dernier CR pour lire les décisions prises.

---

## 4. FONCTIONNALITÉS ET INTERACTIONS

### Matrice des Fonctionnalités

| Module               | Fonctionnalité              | Rôle : Responsable | Rôle : Chef de Projet    | Rôle : Consultant |
| :------------------- | :-------------------------- | :----------------- | :----------------------- | :---------------- |
| **Authentification** | Login/Logout                | Oui                | Oui                      | Oui               |
| **Admin**            | Gestion Users (CRUD)        | **Total**          | Non                      | Non               |
| **Admin**            | Gestion des Rôles           | **Total**          | Non                      | Non               |
| **Documents**        | Dépôt de fichiers           | Oui                | Oui                      | Oui               |
| **Documents**        | Consultation/Téléchargement | Tout               | Selon droits             | Selon droits      |
| **Documents**        | Classement/Typologie        | Oui                | Oui                      | Non               |
| **Réunions**         | Création / Planification    | Oui                | **Oui (Cœur de métier)** | Non               |
| **Réunions**         | Rédaction Compte-Rendu      | Oui                | **Oui (Cœur de métier)** | Non               |
| **Réunions**         | Consultation Historique     | Oui                | Oui                      | Oui               |
| **Projets**          | Création de Projet          | Oui                | Oui                      | Non               |
| **Projets**          | Suivi d'avancement          | Vue globale        | Mise à jour              | Consultation      |

### Interactions Clés

- **Validation Implicite :** Quand un Chef de Projet upload un CR, il est considéré comme validé pour les Consultants.
- **Flux d'information :** Consultant (Pousse l'info) -> Chef de Projet (Structure l'info) -> Responsable (Consomme l'info structurée).

---

## 5. ANALYSE FONCTIONNELLE DÉTAILLÉE

### 5.1 FEATURE #1 : AUTHENTIFICATION & GESTION DES UTILISATEURS

#### Description Générale

Système de connexion sécurisé permettant l'identification des utilisateurs et la gestion de leurs profils au sein de l'application.

#### Fonctionnalités Détaillées

**A. Authentification**

- **Login :**
  - Formulaire : Email + Mot de passe
  - Validation côté client et serveur
  - Messages d'erreur clairs ("Email incorrect", "Mot de passe invalide")
  - Protection anti-bruteforce (limitation tentatives)
  - Option "Rester connecté" avec session persistante
- **Logout :**
  - Destruction complète de la session
  - Redirection vers page de login
  - Message de confirmation

- **Récupération de mot de passe :**
  - "Mot de passe oublié"
  - Envoi email avec lien temporaire
  - Formulaire de réinitialisation sécurisé

**B. Gestion des Utilisateurs (Admin uniquement)**

- **Création de compte :**
  - Formulaire : Nom, Prénom, Email, Rôle
  - Génération automatique d'un mot de passe temporaire
  - Envoi d'email d'activation
- **Modification :**
  - Changement de rôle
  - Activation/Désactivation de compte
  - Modification des informations personnelles
- **Suppression :**
  - Soft delete (archivage) ou Hard delete
  - Confirmation obligatoire
  - Réaffectation des documents/projets liés

#### Spécifications Techniques

- **Base de données :**

  ```
  Table Users:
  - id (PK)
  - email (UNIQUE)
  - password_hash
  - first_name
  - last_name
  - role_id (FK)
  - is_active
  - created_at, updated_at
  ```

- **Sécurité :**
  - Hash : Bcrypt (coût 10-12)
  - Sessions : JWT ou Session-Based
  - HTTPS obligatoire
  - Protection CSRF

#### Critères d'Acceptation

- ✅ Un utilisateur peut se connecter en moins de 5 secondes
- ✅ Les mots de passe ne sont jamais stockés en clair
- ✅ Un admin peut créer un utilisateur en moins de 2 minutes
- ✅ Les sessions expirent après 24h d'inactivité

---

### 5.2 FEATURE #2 : GESTION DES RÔLES & PERMISSIONS (RBAC)

#### Description Générale

Système de contrôle d'accès basé sur les rôles (Role-Based Access Control) pour sécuriser les fonctionnalités.

#### Les 3 Rôles Principaux

**A. RESPONSABLE (Admin)**

- **Permissions :**
  - Gestion complète des utilisateurs (CRUD)
  - Accès à tous les documents (lecture/écriture/suppression)
  - Accès à tous les projets et réunions
  - Consultation des statistiques globales
  - Export de données

**B. CHEF DE PROJET (Manager)**

- **Permissions :**
  - Création/modification des projets dont il est responsable
  - Planification et gestion des réunions
  - Upload et classement de documents (dans ses projets)
  - Ajout de participants à ses réunions
  - Vue annuaire (consultation uniquement)

**C. CONSULTANT (Member)**

- **Permissions :**
  - Consultation des projets où il est affecté
  - Lecture des comptes-rendus
  - Upload de documents (rapports de mission)
  - Modification de son propre profil

#### Matrice de Permissions Détaillée

| Action             | Admin | Chef Projet | Consultant  |
| :----------------- | :---- | :---------- | :---------- |
| Créer utilisateur  | ✅    | ❌          | ❌          |
| Voir tous les docs | ✅    | 🟡 Partiels | 🟡 Partiels |
| Créer projet       | ✅    | ✅          | ❌          |
| Créer réunion      | ✅    | ✅          | ❌          |
| Supprimer doc      | ✅    | 🟡 Ses docs | 🟡 Ses docs |
| Export global      | ✅    | ❌          | ❌          |

#### Spécifications Techniques

```
Table Roles:
- id (PK)
- name (Admin, Manager, Member)
- permissions (JSON ou table pivot)

Table Permissions:
- id (PK)
- name (create_user, delete_doc, etc.)
- description
```

#### Implémentation

- **Middleware Backend :**
  - Vérification du rôle à chaque appel API
  - Retour HTTP 403 si accès interdit
- **Frontend :**
  - Masquage des boutons selon le rôle
  - Redirection automatique si accès non autorisé

#### Critères d'Acceptation

- ✅ Un consultant ne peut jamais accéder à l'écran "Admin"
- ✅ Les APIs refusent les actions non autorisées (même sans UI)
- ✅ Le rôle d'un utilisateur peut être changé par un admin en temps réel

---

### 5.3 FEATURE #3 : GESTION ÉLECTRONIQUE DE DOCUMENTS (GED)

#### Description Générale

Système central pour le stockage, l'organisation et la consultation des fichiers. C'est le cœur de l'application.

#### Fonctionnalités Détaillées

**A. Upload de Fichiers**

- **Formats acceptés :**
  - Documents : PDF, DOCX, XLSX, PPTX
  - Images : JPG, PNG (pour scan de signatures)
  - Limite : 10 MB par fichier

- **Processus d'upload :**
  1. Sélection fichier (Drag & Drop ou Browse)
  2. Remplissage des métadonnées obligatoires
  3. Barre de progression (Upload en cours)
  4. Confirmation avec lien vers le document

- **Métadonnées obligatoires :**
  - **Nom du document**
  - **Type** (Liste déroulante) :
    - Rapport de mission
    - Compte-rendu de réunion
    - Document administratif
    - Contrat/Convention
    - Autre
  - **Projet associé** (si applicable)
  - **Date du document**
  - **Description** (facultatif, mais recommandé)

**B. Organisation des Documents**

- **Classification par Type :**
  - Vue liste avec filtres (Type, Date, Projet)
  - Tri par date (croissant/décroissant)
- **Arborescence Logique :**
  ```
  Documents/
  ├── Rapports/
  ├── Comptes-Rendus/
  ├── Administratif/
  └── Projets/
      ├── Projet Alpha/
      └── Projet Beta/
  ```

**C. Consultation & Téléchargement**

- **Vue Liste :**
  - Miniature (si image/PDF)
  - Nom du document
  - Auteur
  - Date d'ajout
  - Taille du fichier
  - Actions : Télécharger, Supprimer (si droits)

- **Prévisualisation :**
  - Affichage PDF dans le navigateur
  - Aperçu rapide sans téléchargement

**D. Recherche de Documents**

- **Barre de recherche globale :**
  - Recherche par nom de fichier
  - Recherche par auteur
  - Recherche par contenu (métadonnées)
- **Filtres avancés :**
  - Par période (Ce mois, Cette année)
  - Par type de document
  - Par projet

#### Spécifications Techniques

**Base de Données :**

```
Table Documents:
- id (PK)
- filename
- original_name
- file_path (stockage serveur)
- file_size
- mime_type
- type (enum: rapport, cr, admin, etc.)
- project_id (FK, nullable)
- meeting_id (FK, nullable)
- uploaded_by (FK -> Users)
- uploaded_at
- description (TEXT)
```

**Stockage :**

- **Local (MVP) :** Dossier `/uploads/` sur le serveur
- **Idéal (Production) :** Cloud Storage (AWS S3, Azure Blob)
- **Naming Convention :** `{timestamp}_{random}_{sanitized_filename}.ext`

**API Endpoints :**

- `POST /api/documents/upload` - Upload un fichier
- `GET /api/documents` - Liste des documents (avec filtres)
- `GET /api/documents/:id/download` - Téléchargement
- `DELETE /api/documents/:id` - Suppression (avec vérif droits)

#### Sécurité

- **Upload :**
  - Validation MIME type (pas de .exe, .sh)
  - Scan antivirus (idéal)
  - Sanitization du nom de fichier (suppression caractères spéciaux)
- **Téléchargement :**
  - Vérification des droits avant de servir le fichier
  - URL signée temporairement (expire après 1h)

#### Critères d'Acceptation

- ✅ Un utilisateur peut uploader un PDF de 5 MB en moins de 10 secondes
- ✅ La recherche retourne des résultats en moins de 1 seconde
- ✅ Un document supprimé n'est plus accessible immédiatement
- ✅ Les fichiers sont classés logiquement par projet/type

---

### 5.4 FEATURE #4 : GESTION DES RÉUNIONS

#### Description Générale

Module permettant de planifier, documenter et archiver les réunions avec leurs comptes-rendus et pièces jointes.

#### Fonctionnalités Détaillées

**A. Création de Réunion**

- **Formulaire :**
  - **Titre** (obligatoire)
  - **Date & Heure** (Date picker)
  - **Lieu** (Physique ou Lien visio)
  - **Ordre du jour** (Champ texte multi-ligne)
  - **Participants** (Multi-select depuis l'annuaire)
  - **Projet associé** (Si applicable)

- **Workflow :**
  1. Chef de projet remplit le formulaire
  2. Système enregistre la réunion
  3. Notification aux participants (Email/In-app)
  4. Ajout automatique au calendrier

**B. Rédaction de Compte-Rendu**

- **Interface d'édition :**
  - Éditeur WYSIWYG (Rich Text)
  - Sections pré-remplies :
    - Présents / Absents / Excusés
    - Points discutés
    - Décisions prises
    - Actions à suivre (To-Do List)
    - Prochaine réunion
- **Mode de saisie :**
  - Pendant la réunion (Édition live)
  - Après la réunion (Rédaction différée)
  - Auto-sauvegarde toutes les 30 secondes

**C. Association de Documents**

- **Upload direct :**
  - Depuis la fiche réunion
  - Documents liés automatiquement
  - Types : Feuille de présence, Slides, Annexes

**D. Historique & Consultation**

- **Vue Liste des Réunions :**
  - Filtres : Par date, Par projet, Par type
  - Tri : Plus récentes en premier
- **Vue Détail :**
  - Informations de la réunion
  - Compte-rendu complet
  - Liste des documents joints
  - Liste des participants

**E. États d'une Réunion**

- **À venir** (Planifiée)
- **En cours** (Le jour J)
- **Terminée - CR en attente**
- **Clôturée** (CR rédigé et validé)

#### Spécifications Techniques

**Base de Données :**

```
Table Meetings:
- id (PK)
- title
- date_time
- location
- agenda (TEXT)
- minutes (TEXT) -- Le compte-rendu
- project_id (FK, nullable)
- created_by (FK -> Users)
- status (enum: planned, ongoing, closed)
- created_at, updated_at

Table Meeting_Participants:
- meeting_id (FK)
- user_id (FK)
- status (present, absent, excused)
```

**API Endpoints :**

- `POST /api/meetings` - Créer une réunion
- `GET /api/meetings` - Liste des réunions
- `GET /api/meetings/:id` - Détails d'une réunion
- `PUT /api/meetings/:id/minutes` - Mise à jour du CR
- `POST /api/meetings/:id/documents` - Lier un document

#### Critères d'Acceptation

- ✅ Une réunion peut être créée en moins de 3 minutes
- ✅ Le compte-rendu peut être rédigé en temps réel
- ✅ Les participants reçoivent une notification 24h avant
- ✅ Les documents liés sont accessibles depuis la fiche réunion

---

### 5.5 FEATURE #5 : GESTION DES PROJETS

#### Description Générale

Module permettant de structurer le travail autour de projets clairement définis, avec suivi de l'avancement.

#### Fonctionnalités Détaillées

**A. Création de Projet**

- **Formulaire :**
  - **Nom du projet** (obligatoire)
  - **Description**
  - **Date de début / Date de fin** (Timeline)
  - **Chef de projet responsable** (Select)
  - **Membres de l'équipe** (Multi-select)
  - **Statut** (En préparation, En cours, Clôturé)

**B. Fiche Projet**

- **Informations Générales**
- **Timeline :**
  - Date de début
  - Date de fin prévue
  - Progression (% d'avancement)

**C. Suivi d'Avancement**

- **Indicateurs :**
  - Nombre de réunions tenues
  - Nombre de documents produits
  - Nombre de tâches complétées
- **Historique des Actions :**
  - Journal des événements (Document ajouté, Réunion créée)

**D. Vue Projet**

- **Onglet Documents :** Tous les docs liés au projet
- **Onglet Réunions :** Toutes les réunions du projet
- **Onglet Équipe :** Liste des membres avec rôles

#### Spécifications Techniques

**Base de Données :**

```
Table Projects:
- id (PK)
- name
- description (TEXT)
- start_date
- end_date
- status (enum: draft, active, closed)
- manager_id (FK -> Users)
- created_at, updated_at

Table Project_Members:
- project_id (FK)
- user_id (FK)
- role (manager, member)
```

**Logique de Liaison :**

- Un document peut être lié à un projet via `project_id`
- Une réunion peut être liée à un projet via `project_id`
- Cette liaison permet de filtrer et organiser automatiquement

#### Critères d'Acceptation

- ✅ Un projet peut être créé en moins de 5 minutes
- ✅ L'avancement du projet est calculé automatiquement
- ✅ Tous les documents d'un projet sont accessibles en un clic

---

### 5.6 FEATURE #6 : TABLEAU DE BORD (DASHBOARD)

#### Description Générale

Interface de visualisation centralisée offrant une vue d'ensemble de l'activité selon le rôle de l'utilisateur.

#### Dashboards par Rôle

**A. Dashboard Responsable (Vue Stratégique)**

- **KPIs Globaux :**
  - Nombre total de projets (Actifs / Clôturés)
  - Nombre de documents uploadés (Ce mois)
  - Nombre de réunions tenues (Ce mois)
  - Nombre d'utilisateurs actifs
- **Graphiques :**
  - Évolution des documents par mois (Courbe)
  - Répartition des documents par type (Camembert)
- **Dernières Actions :**
  - Feed d'activité (Qui a fait quoi, quand)

**B. Dashboard Chef de Projet (Vue Opérationnelle)**

- **Mes Projets :**
  - Liste des projets dont je suis responsable
  - Statut d'avancement
- **Mes Prochaines Réunions :**
  - Calendrier des 7 prochains jours
- **Documents en Attente :**
  - Documents que je dois valider

**C. Dashboard Consultant (Vue Tâches)**

- **Mes Documents Récents :**
  - Liste des 10 derniers docs que j'ai uploadés
- **Réunions Auxquelles Je Participe :**
  - Prochaines réunions
- **Projets en Cours :**
  - Projets où je suis affecté

#### Spécifications Techniques

- **Widgets Modulaires :** Chaque bloc peut être activé/désactivé
- **Refresh Auto :** Données actualisées toutes les 5 minutes
- **API Endpoints :**
  - `GET /api/dashboard/stats` - Statistiques générales
  - `GET /api/dashboard/activity` - Flux d'activité

#### Critères d'Acceptation

- ✅ Le dashboard se charge en moins de 2 secondes
- ✅ Les informations affichées sont pertinentes au rôle
- ✅ Le flux d'activité montre les 20 dernières actions

---

### 5.7 FEATURE #7 : RECHERCHE GLOBALE

#### Description Générale

Moteur de recherche puissant pour retrouver rapidement n'importe quelle information dans l'application.

#### Fonctionnalités

- **Barre de Recherche :**
  - Positionnée en haut de chaque page
  - Raccourci clavier : `Ctrl + K`
- **Recherche Multi-critères :**
  - Recherche dans les noms de documents
  - Recherche dans les titres de réunions
  - Recherche dans les noms de projets
  - Recherche dans les métadonnées

- **Résultats Catégorisés :**
  - Documents (X résultats)
  - Réunions (Y résultats)
  - Projets (Z résultats)

#### Spécifications Techniques

- **Backend :**
  - Requête SQL avec `LIKE %keyword%`
  - Ou moteur de recherche Full-Text (Elasticsearch pour version avancée)
- **Performance :**
  - Index sur les colonnes searchables
  - Cache des recherches fréquentes

---

### 5.8 FEATURE #8 : SYSTÈME DE NOTIFICATIONS

#### Description Générale

Système d'alerte pour informer les utilisateurs des événements importants.

#### Types de Notifications

**A. Notifications Email**

- Nouvelle réunion planifiée
- Rappel réunion (24h avant)
- Document ajouté à un projet
- Changement de rôle

**B. Notifications In-App**

- Badge sur l'icône de notification
- Liste déroulante des notifications
- Marquage lu/non-lu

#### Spécifications Techniques

```
Table Notifications:
- id (PK)
- user_id (FK)
- type (meeting_created, doc_uploaded, etc.)
- message (TEXT)
- is_read (BOOLEAN)
- created_at
```

---

### 5.9 Exigences Techniques Globales

#### Architecture

- **Type :** Application Web (Client-Server)
- **Pattern :** MVC ou MVVM
- **API :** RESTful ou GraphQL

#### Stack Technologique Recommandée

**Frontend :**

- **Framework :** React.js + TypeScript (ou Vue.js/Angular)
- **UI Library :** Tailwind CSS, Material-UI, Ant Design
- **State Management :** Redux, Zustand ou Context API
- **Formulaires :** React Hook Form + Yup (validation)

**Backend :**

- **Option 1 :** Node.js + Express + TypeScript
- **Option 2 :** Laravel (PHP) avec Sanctum (Auth)
- **Option 3 :** Django (Python) + Django REST Framework
- **ORM :** Prisma (Node), Eloquent (Laravel), Django ORM

**Base de Données :**

- **Principale :** PostgreSQL (robuste, relations complexes)
- **Alternative :** MySQL
- **Pour le Hackathon :** SQLite (rapide à setup)

**Authentification :**

- JWT (JSON Web Tokens)
- Sessions sécurisées avec cookies HttpOnly

**Stockage Fichiers :**

- **MVP :** Système de fichiers local
- **Production :** AWS S3, Azure Blob Storage, ou Cloudinary

#### Sécurité

- **HTTPS :** Obligatoire en production
- **CORS :** Configuration stricte
- **XSS Protection :** Sanitization des inputs
- **SQL Injection :** Utilisation d'ORM avec prepared statements
- **CSRF Protection :** Tokens anti-CSRF

#### Performance

- **Lazy Loading :** Chargement progressif des documents
- **Pagination :** Max 50 items par page
- **Compression :** Gzip pour les réponses API
- **Cache :** Redis pour les queries fréquentes (optionnel)

---

### 5.10 Contraintes Projet

#### Contraintes Temporelles

- **Durée :** 42 heures (Hackathon)
- **Découpage :**
  - H0-H4 : Setup + MCD + Mockups
  - H4-H20 : Développement MVP (Auth + GED + Réunions)
  - H20-H36 : Fonctionnalités avancées (Dashboard + Projets)
  - H36-H42 : Tests, Debug, Préparation démo

#### Contraintes Techniques

- **Responsive Design :** Obligatoire (Mobile-first)
- **Navigateurs :** Chrome, Firefox, Safari (dernières versions)
- **Performance :** Temps de chargement < 3 secondes

#### Contraintes Budgétaires

- **Budget :** 0€
- **Solutions :** Open Source uniquement
- **Hébergement (Démo) :** Vercel, Netlify, Heroku (free tier)

#### Contraintes UX

- **Simplicité :** Interface épurée "Apple-like"
- **Intuitivité :** Un utilisateur doit comprendre sans formation
- **Accessibilité :** Respect des normes WCAG (niveau A minimum)

---

## 6. ANALYSE CRITIQUE DU CAHIER DES CHARGES

### 6.1 Éléments Flous ou Manquants

#### A. Points Techniques Non Clarifiés

**1. Moteur de Recherche**

- **Constat :** Non mentionné dans le cahier des charges
- **Impact :** Avec potentiellement des milliers de documents, l'absence de recherche rend la GED inutilisable
- **Recommandation :** Ajouter une barre de recherche globale au MVP
- **Effort estimé :** 4-6 heures de développement

**2. Système de Notifications**

- **Constat :** Aucune mention des alertes/notifications
- **Questions :**
  - Comment un participant sait-il qu'une réunion est annulée ?
  - Qui est notifié quand un document est ajouté ?
  - Email ou notification in-app ?
- **Recommandation :** Notifications email minimum pour le MVP
- **Effort estimé :** 6-8 heures

**3. Gestion des Versions de Documents**

- **Constat :** Non spécifié
- **Questions :**
  - Si je modifie un document, qu'arrive-t-il à l'ancien ?
  - Faut-il un historique des versions ?
- **Analyse :** Le versioning est standard pour une GED professionnelle
- **Recommandation MVP :** Écrasement simple (pas de versioning pour 42h)
- **Recommandation Production :** Système de versioning complet

**4. Gestion de la Volumétrie**

- **Manque :** Aucune indication sur :
  - Volume de stockage prévu
  - Nombre de documents attendus
  - Taille maximale par fichier
- **Impact :** Impossible d'estimer l'infrastructure nécessaire
- **Questions au client :**
  - Combien de documents uploadez-vous par mois ?
  - Quelle est la taille moyenne d'un fichier ?

**5. Migration des Données Existantes**

- **Constat :** Pas de mention d'import depuis Google Drive
- **Question Critique :** Repartent-ils de zéro ou faut-il importer l'existant ?
- **Impact :** Si import nécessaire, ajouter 10-15h de développement

**6. Règles de Validation Métier**

- **Exemples de flous :**
  - Qui peut supprimer un document ?
  - Un compte-rendu doit-il être validé avant publication ?
  - Peut-on modifier une réunion passée ?
- **Recommandation :** Atelier de clarification avec le client (2h)

#### B. Spécifications UX Manquantes

**1. Design System**

- Pas de charte graphique fournie
- Couleurs ? Logo ? Typographie ?
- **Action :** Proposer une palette sobre et professionnelle

**2. Ergonomie Mobile**

- Mention "Responsive" mais pas de précision sur :
  - Quelles fonctionnalités sur mobile ?
  - Peut-on uploader depuis un smartphone ?
- **Recommandation :** Mobile en lecture seule pour le MVP

**3. Accessibilité**

- Aucune mention de normes WCAG
- Utilisateurs en situation de handicap ?
- **Recommandation :** Respect des normes de base (contraste, alt text)

#### C. Aspects Organisationnels Flous

**1. Gouvernance des Données**

- Qui est propriétaire des documents ?
- Qui peut supprimer définitivement ?
- Durée de conservation des données ?

**2. Formation des Utilisateurs**

- Le cahier des charges ne mentionne pas de formation
- **Risque :** Rejet de l'outil par les utilisateurs non-tech
- **Recommandation :** Prévoir une vidéo de démonstration + FAQ

**3. Support & Maintenance**

- Qui assure le support après le hackathon ?
- Qui hébergera l'application ?
- Budget pour la maintenance ?

---

### 6.2 Incohérences Détectées

#### Incohérence #1 : Ambition vs Temps

- **Constat :** Le cahier des charges demande :
  - 3 rôles avec permissions complexes
  - 4 modules majeurs (Users, Docs, Meetings, Projects)
  - Dashboard avec statistiques
  - Code documenté et maintenable
- **Réalité :** 42 heures de développement
- **Analyse :** C'est physiquement impossible de tout faire avec qualité
- **Résolution :** Couper le périmètre (voir priorités MVP)

#### Incohérence #2 : "Simple et Intuitif" vs Fonctionnalités

- **Demande :** Interface simple pour bénévoles
- **Mais aussi :** Multiples fonctionnalités avancées
- **Contradiction :** Plus il y a de features, plus l'interface est complexe
- **Résolution :** Navigation progressive (mode simplifié par défaut)

#### Incohérence #3 : "Prototype" vs "Production Ready"

- **Citation :** "Application fonctionnelle" (Prototype)
- **Mais :** "TILI s'engage à l'utiliser" (Production)
- **Problème :** Un prototype n'a pas la robustesse d'un outil de production
- **Clarification nécessaire :** S'agit-il d'une POC ou d'un outil définitif ?

---

### 6.3 Risques Projet Détaillés

#### Risques Techniques

**RISQUE #1 : Le "Scope Creep" (Dérive du périmètre)**

- **Probabilité :** 🔴 Très Élevée
- **Impact :** 🔴 Critique
- **Description :** Tenter d'implémenter toutes les fonctionnalités "Nice to Have" avant de finaliser le MVP
- **Conséquence :** Livraison d'un produit à 50% qui ne marche pas correctement
- **Mitigation :**
  - Définir un MVP strict (En réunion équipe, H+2)
  - Interdire tout ajout de feature hors MVP
  - Timeboxing strict par module

**RISQUE #2 : Complexité de la Gestion des Droits**

- **Probabilité :** 🟠 Élevée
- **Impact :** 🟠 Majeur
- **Description :** Se perdre dans une matrice de permissions trop fine
- **Exemple :** "Le consultant A voit le projet B mais pas la réunion C du projet B"
- **Temps perdu estimé :** 10-15 heures
- **Mitigation :**
  - Simplifier : 2 rôles pour le MVP (Admin vs User)
  - Affiner après le hackathon

**RISQUE #3 : Gestion de l'Upload de Fichiers**

- **Probabilité :** 🟠 Élevée
- **Impact :** 🔴 Critique
- **Description :** Bugs sur l'upload (timeout, taille, corruption)
- **Conséquence :** Si l'upload ne marche pas, tout le projet échoue
- **Mitigation :**
  - Tester l'upload dès H+4
  - Utiliser une librairie éprouvée (Multer pour Node, etc.)
  - Limiter la taille des fichiers (5 MB max pour démo)

**RISQUE #4 : Performance de la Base de Données**

- **Probabilité :** 🟡 Moyenne
- **Impact :** 🟠 Majeur
- **Description :** Requêtes lentes avec beaucoup de données
- **Mitigation :**
  - Indexation des colonnes clés (user_id, project_id)
  - Pagination obligatoire (jamais de SELECT \* sans LIMIT)

#### Risques Humains

**RISQUE #5 : Épuisement de l'Équipe**

- **Probabilité :** 🟠 Élevée
- **Impact :** 🟠 Majeur
- **Description :** 42h non-stop = baisse de productivité et bugs
- **Mitigation :**
  - Planifier des pauses (2h toutes les 8h)
  - Rotation des tâches (pas 12h de CSS d'affilée)

**RISQUE #6 : Communication Interne**

- **Probabilité :** 🟡 Moyenne
- **Impact :** 🟠 Majeur
- **Description :** Dépendances croisées (Backend attend Frontend et vice-versa)
- **Mitigation :**
  - Daily Standup toutes les 8h
  - Définir les contrats d'API dès H+2
  - Mock des APIs pour travailler en parallèle

#### Risques Fonctionnels

**RISQUE #7 : UX/UI Négligée**

- **Probabilité :** 🔴 Très Élevée (Hackathon)
- **Impact :** 🔴 Critique
- **Description :** Interface confuse = rejet par les utilisateurs
- **Conséquence :** TILI n'utilise pas l'outil après le hackathon
- **Mitigation :**
  - Utiliser un Admin Template (Gain de 15h)
  - Faire tester par 1 utilisateur externe à H+30

**RISQUE #8 : Pas de Tests**

- **Probabilité :** 🔴 Certaine (Hackathon)
- **Impact :** 🟠 Majeur
- **Description :** Code non testé = bugs en démo
- **Mitigation :**
  - Tests manuels du "Happy Path" à H+36
  - Checklist de démo à H+38

#### Risques Organisationnels

**RISQUE #9 : Attentes Irréalistes du Client**

- **Probabilité :** 🟡 Moyenne
- **Impact :** 🟠 Majeur
- **Description :** Le client s'attend à un produit fini en 42h
- **Mitigation :**
  - Cadrer les attentes dès le début
  - Expliquer : "C'est un MVP, pas un produit final"

**RISQUE #10 : Problème Technique de Dernière Minute**

- **Probabilité :** 🟠 Élevée
- **Impact :** 🔴 Critique
- **Description :** Bug bloquant découvert 2h avant la démo
- **Mitigation :**
  - Deadline interne à H+40 (pas H+42)
  - Environnement de démo figé et testé

---

### 6.4 Analyse Coût-Bénéfice des Fonctionnalités

| Fonctionnalité            | Valeur Métier | Complexité | Ratio      | Priorité       |
| :------------------------ | :------------ | :--------- | :--------- | :------------- |
| Authentification          | 🔴 Critique   | 🟢 Faible  | ⭐⭐⭐⭐⭐ | **MVP**        |
| GED (Upload/Consultation) | 🔴 Critique   | 🟠 Moyenne | ⭐⭐⭐⭐⭐ | **MVP**        |
| Gestion Réunions          | 🔴 Critique   | 🟠 Moyenne | ⭐⭐⭐⭐   | **MVP**        |
| Recherche                 | 🟠 Haute      | 🟡 Moyenne | ⭐⭐⭐⭐   | **MVP**        |
| Gestion Projets           | 🟡 Moyenne    | 🟠 Moyenne | ⭐⭐⭐     | Nice-to-Have   |
| Dashboard Stats           | 🟡 Moyenne    | 🟠 Moyenne | ⭐⭐       | Nice-to-Have   |
| Notifications Email       | 🟠 Haute      | 🟡 Moyenne | ⭐⭐⭐     | Nice-to-Have   |
| Export PDF                | 🟢 Faible     | 🟡 Moyenne | ⭐         | Post-Hackathon |
| Dark Mode                 | 🟢 Faible     | 🟢 Faible  | ⭐         | Post-Hackathon |

---

## 7. APPROFONDISSEMENT & LECTURE EXPERTE

### 7.1 Ce Que le Cahier des Charges Ne Dit Pas (Mais Qu'il Faut Comprendre)

#### A. La Vraie Nature du Problème

**Ce N'est PAS un Problème Technique**

- TILI sait stocker des fichiers (ils utilisent Google Drive)
- TILI sait organiser des réunions (ils le font déjà)
- Le problème n'est donc pas "Comment stocker ?" mais "Comment RETROUVER ?"

**C'est un Problème Organisationnel**

- **Chaos de l'information :** Les documents sont dispersés
- **Perte de mémoire :** Personne ne sait où est le dernier rapport
- **Duplication d'effort :** On refait ce qui a déjà été fait
- **Manque de traçabilité :** "Qui a décidé quoi et quand ?"

**L'Application Doit Être un "Secrétaire Rigoureux"**

- Elle doit **imposer** une structure (gentiment)
- Elle doit **empêcher** le désordre (validation des champs)
- Elle doit **faciliter** la retrouvabilité (recherche)
- Elle doit **documenter** l'activité (historique)

#### B. La Donnée Pivot : La Réunion

**Analyse Profonde :**
Dans une association à but non lucratif :

- Les décisions se prennent en réunion
- Les actions naissent des comptes-rendus
- Les documents sont souvent produits SUITE à une réunion

**Conséquence pour le Design :**
Le modèle de données doit refléter cette réalité :

```
RÉUNION (Centre du système)
    ├── Décisions prises → Comptes-rendus
    ├── Documents produits → Fichiers liés
    ├── Actions à mener → (Future : To-Do List)
    └── Projet concerné → Contexte
```

**Si on réussit ce lien, on crée de la valeur.**
_"Retrouver tous les documents de la réunion du 12 janvier sur le Projet Alpha"_ doit être instantané.

#### C. Les Enjeux Humains Cachés

**1. Résistance au Changement**

- Le cahier des charges ne le dit pas, mais :
  - Certains membres sont habitués à leur "désordre organisé"
  - Passer d'un Google Drive à un outil structuré = effort cognitif
- **Implication :** L'UX doit être **extrêmement** intuitive, sinon rejet

**2. Hétérogénéité des Profils**

- Responsables : Probablement à l'aise avec les outils numériques
- Consultants : Peuvent être moins tech-savvy
- Bénévoles : Engagement variable
- **Implication :** L'interface doit s'adapter au niveau le plus faible

**3. Culture Associative**

- Contrairement à une entreprise, on ne peut pas "imposer" un outil
- Les utilisateurs sont volontaires → Si l'outil est frustrant, ils l'abandonnent
- **Implication :** L'adoption est plus critique que la performance technique

#### D. Le Paradoxe de la Simplicité

**Le Client Demande :**

- Une interface "simple et intuitive"
- Mais aussi 4 modules complexes (Users, Docs, Meetings, Projects)

**La Réalité :**

- Plus il y a de fonctionnalités, moins c'est "simple"
- Il faut choisir : Puissance OU Simplicité

**La Solution : Navigation Progressive**

1. **Niveau 1 (Nouveau user) :** Vue simplifiée
   - "Mes documents récents"
   - "Mes prochaines réunions"
2. **Niveau 2 (User confirmé) :** Accès aux modules avancés
   - Filtres complexes
   - Statistiques
3. **Niveau 3 (Admin) :** Tous les pouvoirs
   - Configuration
   - Gestion des droits

**Analogie :** Comme Gmail (Vue simple par défaut, mais options avancées cachées)

---

### 7.2 Impacts Techniques Profonds

#### A. Architecture de l'Information

**Hiérarchie Recommandée :**

```
ORGANISATION (TILI)
└── PROJETS
    ├── RÉUNIONS
    │   ├── Comptes-Rendus (Texte)
    │   └── Documents Liés (Fichiers)
    └── DOCUMENTS GÉNÉRAUX
        └── Fichiers (Rapports, Admin, etc.)
```

**Pourquoi cette hiérarchie ?**

- Un **Projet** est le conteneur de niveau supérieur (contexte)
- Les **Réunions** sont des moments clés du projet (événements)
- Les **Documents** sont liés soit à une réunion, soit au projet en général

#### B. Choix Technologiques Implicites

**1. Base de Données Relationnelle OBLIGATOIRE**

- **Pourquoi :** Les relations (User <-> Doc, Meeting <-> Project) sont complexes
- **NoSQL serait une erreur :** MongoDB ne gère pas bien les jointures
- **Recommandation :** PostgreSQL (robuste, gratuit, bien documenté)

**2. Stockage des Fichiers : Deux Écoles**

**Option A : Stockage Local (Recommandé pour MVP)**

- Fichiers dans `/uploads/` sur le serveur
- ✅ Simple à implémenter
- ✅ Pas de dépendance externe
- ❌ Pas scalable (si succès)
- ❌ Backup manuel nécessaire

**Option B : Cloud Storage (Recommandé pour Production)**

- AWS S3, Azure Blob, ou Cloudinary
- ✅ Scalable
- ✅ Backup automatique
- ❌ Complexité accrue
- ❌ Coût (même si faible)

**Décision :** Local pour le Hackathon, Cloud pour la V2

**3. Authentification : Pourquoi JWT ?**

- **Contexte :** Application web (pas mobile native)
- **JWT (JSON Web Tokens) :**
  - ✅ Stateless (pas de session serveur)
  - ✅ Scalable (plusieurs serveurs possibles)
  - ✅ Standard moderne
- **Alternative :** Sessions classiques (Cookies)
  - ✅ Plus simple pour débuter
  - ❌ Nécessite un store (Redis)

**Décision :** Sessions pour MVP (Simplicité), JWT pour V2

#### C. Performance & Scalabilité

**Questions que le CDC ne pose pas (mais qu'il faut anticiper) :**

**1. Combien d'utilisateurs simultanés ?**

- 25 membres actifs mentionnés
- Hypothèse : Max 10 simultanés
- **Implication :** Architecture simple suffit (pas besoin de load balancer)

**2. Volume de données attendu ?**

- 5000 bénéficiaires mentionnés
- Hypothèse : 1 document par bénéficiaire = 5000 docs
- Taille moyenne : 2 MB
- **Total :** ~10 GB de stockage
- **Implication :** Serveur avec 50 GB suffit largement

**3. Temps de réponse attendu ?**

- Non spécifié, mais standard UX :
  - Chargement page : < 3 secondes
  - Recherche : < 1 seconde
  - Upload : Dépend de la connexion

---

### 7.3 Impacts Organisationnels

#### A. Gouvernance Post-Lancement

**Le CDC dit :** "TILI s'engage à utiliser l'outil"
**Mais ne dit pas :**

- Qui sera l'administrateur système ?
- Qui crée les comptes des nouveaux membres ?
- Qui gère les droits d'accès ?
- Qui forme les utilisateurs ?

**Recommandation :**
Inclure dans les livrables :

- Un manuel administrateur (PDF 5 pages)
- Une vidéo de formation (10 minutes)
- Une FAQ (10 questions courantes)

#### B. Maintenance & Support

**Le CDC est silencieux sur :**

- Qui corrige les bugs après le hackathon ?
- Budget disponible pour l'hébergement ?
- Roadmap V2 (futures évolutions) ?

**Risque :**
L'application devient un "Zombieware" :

- Fonctionne 3 mois
- Premier bug bloquant
- Personne pour corriger
- Abandon de l'outil

**Mitigation :**

- Code open source sur GitHub
- Documentation technique complète
- Architecture simple (facilite les modifications)

#### C. Adoption & Change Management

**Facteurs de Succès :**

1. **Champions internes :** Identifier 2-3 utilisateurs enthousiastes
2. **Quick Wins :** Montrer les bénéfices dès la première semaine
3. **Formation progressive :** Pas tout en même temps

**Facteurs d'Échec :**

1. Interface trop complexe
2. Bugs fréquents
3. Temps de chargement lent
4. Pas de support utilisateur

---

### 7.4 Le Non-Dit Culturel

#### A. Contexte Tunisien

**Éléments à considérer :**

- Langue : Français ou Arabe ? (Le CDC est en français → Interface en français)
- Connectivité : Quelle est la qualité d'Internet ? (Peut impacter l'upload)
- Équipement : Les membres ont-ils tous un ordinateur ? (Mobile crucial)

**Questions à poser au client :**

- "Vos consultants de terrain ont-ils un smartphone ou un PC ?"
- "Avez-vous besoin d'une version arabe ?"

#### B. Particularités du Secteur Associatif

**Différences avec une Entreprise :**

- Budget limité (gratuit ou low-cost)
- Turnover des bénévoles (documentation essentielle)
- Pas d'équipe IT interne (simplicité technique)

**Implications :**

- Hébergement : Solutions gratuites (Supabase, Vercel, Railway)
- Maintenance : Doit être minimale
- Formation : Auto-apprenante (tooltips, tutoriel intégré)

---

### 7.5 Analyse Sémiotique du CDC

#### A. Ce Que les Mots Révèlent

**"Plateforme Centralisée"**
→ Ils veulent UN lieu unique (fin de la dispersion)

**"Structure et organise"**
→ Ils ont un problème de chaos (pas de discipline actuelle)

**"Documenter les actions"**
→ Ils veulent de la traçabilité (mémoire institutionnelle)

**"Interface intuitive"**
→ Ils reconnaissent la diversité des compétences tech

**"S'engage à utiliser"**
→ C'est un vrai besoin (pas un exercice théorique)

#### B. Ce Que le Ton Implique

Le CDC est :

- ✅ Clair sur les besoins fonctionnels
- ✅ Réaliste sur les contraintes (42h)
- ⚠️ Optimiste sur le périmètre (beaucoup de features)
- ❌ Silencieux sur les aspects post-lancement

**Interprétation :**
Le client a besoin d'un MVP fonctionnel MAINTENANT, quitte à l'améliorer après. Ce n'est pas un "nice to have", c'est une nécessité opérationnelle.

---

### 7.6 Les 3 Niveaux de Lecture du CDC

#### Niveau 1 : Lecture Littérale

"Je veux une application pour gérer des documents et des réunions"

#### Niveau 2 : Lecture Fonctionnelle

"Je veux résoudre mon problème de désorganisation interne"

#### Niveau 3 : Lecture Stratégique (Expert)

"Je veux **professionnaliser** mon association pour être crédible auprès des bailleurs de fonds et des partenaires"

**C'est le Niveau 3 qu'un Chef de Projet Senior comprend.**

---

### 7.7 L'Équation du Succès (Formule Secrète)

```
Succès = (Fonctionnalités MVP × Stabilité × UX)
         ──────────────────────────────────────
              Complexité × Bugs × Temps d'apprentissage
```

**Traduction :**

- Plus c'est simple, stable et beau → Plus le succès est élevé
- Plus c'est complexe, buggy et difficile à apprendre → Plus c'est l'échec

**Objectif du Chef de Projet :**
Maximiser le numérateur, minimiser le dénominateur.

---

### 7.8 Synthèse : Le Vrai Cahier des Charges (Version Non-Dite)

**Ce que le client veut VRAIMENT :**

> "Donnez-moi un outil qui empêche mon équipe de perdre du temps à chercher des documents, qui documente nos décisions, et qui soit tellement simple que même un nouveau bénévole puisse l'utiliser sans formation. Si vous faites ça, vous aurez réussi. Le reste (graphiques, stats) c'est du bonus."

**Traduit en Priorités :**

1. **Recherche rapide** (Retrouver un document en 10 secondes)
2. **Upload simple** (Déposer un fichier en 3 clics)
3. **Lien Réunion-Document** (Tout est contextualisé)
4. **Zéro bug** (Fiabilité > Fonctionnalités)

**Ce Que le CDC Ne Pourra Jamais Dire (Mais Qu'il Faut Deviner) :**

> "On a peur que personne n'utilise l'outil si c'est trop compliqué. On a peur de perdre nos données si c'est mal hébergé. On a peur d'être bloqués si ça bug. Rassurez-nous."

**Comment Rassurer :**

- Démo fluide et sans accroc
- Documentation complète
- Code source accessible
- Hébergement fiable

---

## 8. RECOMMANDATIONS STRATÉGIQUES

### 8.1 Améliorations du Cahier des Charges

#### A. Ajouts Fonctionnels Critiques

**1. Moteur de Recherche (OBLIGATOIRE)**

- **Justification :** Une GED sans recherche est inutilisable
- **Spécification :**
  - Barre de recherche globale en header
  - Recherche multi-critères (nom, type, date, auteur)
  - Résultats en temps réel (au fil de la frappe)
  - Shortcut : Ctrl+K ou Cmd+K
- **Effort :** 4-6 heures
- **Priorité :** 🔴 MVP

**2. Système de Notifications de Base**

- **Justification :** Communication essentielle pour la collaboration
- **Spécification MVP :**
  - Email automatique : Invitation à une réunion
  - Email : Rappel 24h avant une réunion
  - (Bonus) Badge in-app pour nouveaux documents
- **Effort :** 6-8 heures
- **Priorité :** 🟠 Très Souhaitable

**3. Gestion des Droits Simplifiée**

- **Problème actuel :** Le cahier des charges suggère une ACL complexe
- **Recommandation :** Pour le MVP, simplifier à 2 niveaux :
  - **Admin** : Tout peut faire
  - **User** : Consultation + Upload (pas de suppression)
- **Affinage Post-MVP :** Ajouter le rôle "Manager" après validation
- **Bénéfice :** Économie de 10h de développement

#### B. Clarifications Techniques

**1. Spécifications de Stockage**

- **À Ajouter au CDC :**
  - Taille max par fichier : 10 MB
  - Formats autorisés : PDF, DOCX, XLSX, PNG, JPG
  - Quota par utilisateur (optionnel) : 500 MB
  - Durée de conservation : Illimitée (sauf suppression manuelle)

**2. Politique de Sauvegarde**

- **À Clarifier avec le client :**
  - Backup automatique quotidien ?
  - Qui gère les sauvegardes ?
  - Durée de rétention des backups ?

**3. Plan de Reprise d'Activité**

- **Question :** Que se passe-t-il si le serveur tombe ?
- **Recommandation :** Hébergement cloud avec haute disponibilité (Azure, AWS)

#### C. Améliorations UX

**1. Onboarding des Nouveaux Utilisateurs**

- **Proposition :** Tutoriel interactif au premier login
  - Étape 1 : "Voici comment uploader un document"
  - Étape 2 : "Voici où trouver les comptes-rendus"
  - Étape 3 : "Voici votre dashboard"
- **Effort :** 4h avec une librairie comme Intro.js

**2. Templates de Compte-Rendu**

- **Proposition :** Proposer 3 templates pré-remplis :
  - Template "Réunion Projet"
  - Template "Réunion Stratégique"
  - Template "Réunion Opérationnelle"
- **Bénéfice :** Gain de temps pour les chefs de projet

**3. Drag & Drop pour Upload**

- **Justification :** UX moderne et intuitive
- **Implémentation :** Zone de drop visible sur chaque page
- **Effort :** 2-3h

---

### 8.2 Questions Essentielles au Client (Checklist)

#### Questions Stratégiques

**1. Vision & Objectifs**

- ❓ _"Quelle est la fonctionnalité qui vous fait perdre le plus de temps aujourd'hui ?"_
  - **But :** Identifier la priorité n°1 pour maximiser la valeur
- ❓ _"À quoi ressemble le succès dans 6 mois ?"_
  - **But :** Aligner les attentes sur le long terme

- ❓ _"Si vous ne pouviez avoir qu'UNE fonctionnalité, laquelle choisiriez-vous ?"_
  - **But :** Forcer la priorisation

#### Questions Techniques

**2. Existant & Migration**

- ❓ _"Combien de documents avez-vous actuellement sur Google Drive ?"_
  - **But :** Estimer le volume de migration
- ❓ _"Comment sont organisés vos dossiers aujourd'hui ?"_
  - **But :** Reproduire leur mental model
- ❓ _"Doit-on importer l'existant ou repartir de zéro ?"_
  - **Impact :** +15h si migration nécessaire

**3. Utilisateurs & Accès**

- ❓ _"Combien d'utilisateurs actifs simultanés attendez-vous ?"_
  - **But :** Dimensionner l'infrastructure
- ❓ _"Des partenaires externes (bailleurs, ONG) auront-ils accès ?"_
  - **Impact :** Sécurité renforcée nécessaire
- ❓ _"Quels sont les profils de vos utilisateurs (âge, technicité) ?"_
  - **But :** Adapter le niveau de complexité de l'UI

**4. Données & Sécurité**

- ❓ _"Y a-t-il des documents confidentiels ?"_
  - **Impact :** Ajout de niveaux de confidentialité
- ❓ _"Quels types de fichiers manipulez-vous le plus ?"_
  - **But :** Prioriser les formats supportés
- ❓ _"Avez-vous des contraintes réglementaires (RGPD, etc.) ?"_
  - **Impact :** Conformité légale

#### Questions Opérationnelles

**5. Processus Métier**

- ❓ _"Qui valide un compte-rendu de réunion ?"_
  - **But :** Définir le workflow de validation
- ❓ _"À quelle fréquence organisez-vous des réunions ?"_
  - **But :** Estimer la charge du module Réunions
- ❓ _"Comment gérez-vous les projets actuellement ?"_
  - **But :** Comprendre leurs habitudes

**6. Support & Maintenance**

- ❓ _"Qui hébergera l'application (serveur TILI ou cloud) ?"_
  - **Impact :** Choix technologiques différents
- ❓ _"Qui assurera le support utilisateur après le hackathon ?"_
  - **But :** Préparer la documentation
- ❓ _"Budget disponible pour l'hébergement et la maintenance ?"_
  - **Impact :** Choix entre solutions gratuites et payantes

#### Questions Démo

**7. Validation & Acceptance**

- ❓ _"Qui sera présent lors de la démo finale ?"_
  - **But :** Adapter le pitch
- ❓ _"Quels sont les 3 scénarios que vous voulez absolument voir ?"_
  - **But :** Préparer une démo sur-mesure
- ❓ _"Quels sont vos critères de réussite pour ce projet ?"_
  - **But :** S'aligner sur les attentes

---

### 8.3 Plan d'Action Recommandé (Roadmap)

#### Phase 0 : Préparation (H+0 à H+4)

**H+0 → H+1 : Kick-off & Clarification**

- Réunion équipe : Lecture collective du CDC
- Atelier Questions/Réponses avec le client (Mme Asma)
- Identification des flous et incohérences

**H+1 → H+2 : Architecture & Design**

- Création du Modèle Conceptuel de Données (MCD)
- Définition des API endpoints
- Choix de la stack technique (vote équipe)
- Setup de l'environnement de développement

**H+2 → H+4 : Mockups & Prototypage**

- Wireframes papier des écrans principaux
- Design System (couleurs, typo, composants)
- Validation avec le client (si disponible)
- Setup du boilerplate (Frontend + Backend)

#### Phase 1 : MVP Core (H+4 à H+20)

**H+4 → H+8 : Authentification & Users**

- Table Users + Roles
- Formulaire de Login/Logout
- Création de comptes (Admin)
- Middleware de protection des routes
- **Livrable :** On peut se connecter et créer des users

**H+8 → H+16 : GED (Gestion Documentaire)**

- Upload de fichiers (avec métadonnées)
- Stockage sur serveur
- Liste des documents (avec filtres)
- Téléchargement de fichiers
- Suppression (avec droits)
- **Livrable :** On peut uploader et consulter des docs

**H+16 → H+20 : Gestion des Réunions**

- Création de réunion (formulaire)
- Rédaction de compte-rendu (éditeur de texte)
- Association documents <-> réunion
- Liste/Historique des réunions
- **Livrable :** Le cycle complet d'une réunion fonctionne

#### Phase 2 : Fonctionnalités Avancées (H+20 à H+36)

**H+20 → H+24 : Recherche**

- Barre de recherche globale
- Recherche dans Documents + Réunions
- Affichage des résultats catégorisés
- **Livrable :** On peut trouver n'importe quelle info rapidement

**H+24 → H+30 : Gestion des Projets**

- Création de projet
- Association docs/réunions -> projet
- Vue Projet (avec onglets)
- **Livrable :** On peut structurer le travail par projet

**H+30 → H+36 : Dashboard & Polish**

- Dashboard par rôle (stats basiques)
- Flux d'activité récente
- Améliorations UX (erreurs, loaders, feedback)
- Responsive mobile (vérification)
- **Livrable :** L'application est "pro" et agréable à utiliser

#### Phase 3 : Tests & Démo (H+36 à H+42)

**H+36 → H+38 : Tests Intensifs**

- Tests manuels du Happy Path
- Correction des bugs critiques
- Tests cross-browser (Chrome, Firefox)
- Tests mobile (responsive)

**H+38 → H+40 : Préparation Démo**

- Rédaction du script de démo (User Story)
- Création de données de démonstration (faux users, docs, réunions)
- Répétition de la démo (chronométrer)
- Documentation README.md

**H+40 → H+42 : Buffer & Pitch**

- Marge de sécurité pour imprévus
- Préparation du pitch (slides optionnels)
- Déploiement final
- Derniers ajustements cosmétiques

---

### 8.4 Stratégie de Priorisation (Méthode MoSCoW)

#### MUST HAVE (Obligatoire pour le MVP)

- ✅ Authentification (Login/Logout)
- ✅ Gestion utilisateurs (Admin)
- ✅ Upload de documents
- ✅ Consultation de documents
- ✅ Création de réunions
- ✅ Rédaction de comptes-rendus
- ✅ Association doc <-> réunion

#### SHOULD HAVE (Très Important)

- 🟠 Recherche globale
- 🟠 Gestion des projets (basique)
- 🟠 Dashboard simple
- 🟠 Notifications email (réunions)

#### COULD HAVE (Si le temps le permet)

- 🟡 Statistiques avancées
- 🟡 Export PDF des CRs
- 🟡 Calendrier visuel
- 🟡 Gestion des tags

#### WON'T HAVE (Post-Hackathon)

- 🔵 Versioning des documents
- 🔵 Chat intégré
- 🔵 Mobile App native
- 🔵 Intégration Google Drive
- 🔵 Signature électronique

---

### 8.5 Recommandations Organisationnelles

#### A. Constitution de l'Équipe

**Proposition de Répartition (Équipe de 4 personnes) :**

- **1 Backend Developer** : APIs, BDD, Auth, Upload
- **1 Frontend Developer** : UI/UX, Composants, Intégration
- **1 Full-Stack Developer** : Gestion des réunions, Dashboard
- **1 Chef de Projet / Design** : Coordination, Mockups, Tests

**Règles de Collaboration :**

- Daily Standup toutes les 8 heures
- Utilisation de Git (branches feature/)
- Code Review mutuelle avant merge
- Documentation au fil de l'eau

#### B. Outils Recommandés

**Gestion de Projet :**

- Trello ou Notion (Kanban Board)
- Checklist partagée (Google Sheets)

**Communication :**

- Discord ou Slack (Channel dédié)
- Compte-rendu de chaque Standup

**Développement :**

- GitHub/GitLab (Versioning)
- Figma (Mockups collaboratifs)
- Postman (Tests d'APIs)

**Déploiement Express :**

- Frontend : Vercel ou Netlify
- Backend : Heroku, Render, ou Railway
- Base de Données : PostgreSQL via Supabase ou Neon

---

### 8.6 Checklist de Validation Finale

#### Avant la Démo (H+40)

**Technique :**

- [ ] L'application se charge en moins de 3 secondes
- [ ] Aucune erreur JavaScript dans la console
- [ ] Tous les liens fonctionnent
- [ ] Upload de fichiers testé (PDF, DOCX, XLSX)
- [ ] Téléchargement de fichiers testé
- [ ] Responsive vérifié (Mobile, Tablette, Desktop)
- [ ] Cross-browser testé (Chrome + Firefox minimum)

**Fonctionnel :**

- [ ] Je peux créer un utilisateur
- [ ] Je peux me connecter / déconnecter
- [ ] Je peux uploader un document
- [ ] Je peux créer une réunion
- [ ] Je peux rédiger un compte-rendu
- [ ] Je peux lier un document à une réunion
- [ ] Je peux voir le dashboard
- [ ] La recherche retourne des résultats

**Sécurité :**

- [ ] Les mots de passe sont hashés
- [ ] Un consultant ne peut pas accéder à l'admin
- [ ] Les APIs refusent les actions non autorisées
- [ ] Pas de faille XSS évidente
- [ ] HTTPS activé (si déployé)

**UX/UI :**

- [ ] L'interface est professionnelle et sobre
- [ ] Les erreurs affichent des messages clairs
- [ ] Les boutons réagissent au hover
- [ ] Loaders visibles pendant les chargements
- [ ] Pas de typos dans les textes

**Démo :**

- [ ] Données de démo créées (5 users, 10 docs, 3 réunions)
- [ ] Script de démo rédigé et chronométré (< 10 minutes)
- [ ] Environment de démo stable et testé
- [ ] Video backup enregistrée (au cas où)

---

## 9. RÉSUMÉ FINAL : « Ce Que Ce Projet Est Vraiment »

### 9.1 L'Essence du Projet (En Une Phrase)

> **Ce projet est la construction d'une "Mémoire Institutionnelle Vivante" pour l'association TILI, transformant le chaos informationnel en un patrimoine organisé et accessible.**

---

### 9.2 Les 3 Dimensions du Projet

#### Dimension 1 : TECHNIQUE

**Ce qu'on construit :**
Une application web avec :

- Authentification sécurisée
- Gestion de fichiers (GED)
- Module de réunions
- Système de recherche

**Stack :**
Frontend (React) + Backend (Node/Laravel) + Base SQL + Cloud/Local Storage

#### Dimension 2 : FONCTIONNELLE

**Ce qu'on résout :**

- **Problème #1 :** Où est passé le rapport de janvier ?
  → **Solution :** Recherche instantanée
- **Problème #2 :** Que s'est-il dit lors de la dernière réunion ?
  → **Solution :** Compte-rendu structuré et lié

- **Problème #3 :** Qui a accès à quoi ?
  → **Solution :** Gestion des rôles et permissions

#### Dimension 3 : STRATÉGIQUE

**Ce qu'on permet :**

- **Professionnalisation** de l'association
- **Crédibilité** auprès des bailleurs de fonds
- **Scalabilité** (Passer de 25 à 100 membres sans chaos)
- **Pérennité** (Le savoir survit au turnover)

---

### 9.3 Ce Que Ce Projet N'EST PAS

❌ **Ce n'est PAS un Dropbox bis**
→ Dropbox stocke. Cette app **organise et contextualise**.

❌ **Ce n'est PAS un Google Calendar**
→ Calendar planifie. Cette app **documente et archive les décisions**.

❌ **Ce n'est PAS un Trello ou Asana**
→ Ces outils gèrent les tâches. Cette app gère la **mémoire collective**.

❌ **Ce n'est PAS un ERP complexe**
→ C'est un outil métier spécifique au fonctionnement associatif.

---

### 9.4 Les 3 Piliers du Succès

```
        🏛️ ARCHITECTURE DU SUCCÈS

    ┌───────────────────────────────┐
    │   PILIER 1 : SIMPLICITÉ       │
    │   Interface intuitive          │
    │   Onboarding rapide            │
    └───────────────────────────────┘
                  │
    ┌───────────────────────────────┐
    │   PILIER 2 : FIABILITÉ        │
    │   Zéro bug critique            │
    │   Performance constante        │
    └───────────────────────────────┘
                  │
    ┌───────────────────────────────┐
    │   PILIER 3 : UTILITÉ          │
    │   Résout un vrai problème      │
    │   Valeur immédiate visible     │
    └───────────────────────────────┘
```

**Si un pilier manque, tout s'effondre.**

---

### 9.5 La Valeur Métier (En Chiffres)

#### Sans l'Application (Situation Actuelle)

- ⏱️ **Temps perdu par semaine :** 5 heures/personne à chercher des infos
- 💸 **Coût (si on valorise le temps) :** 5h × 25 membres = 125h/semaine = 500h/mois
- 📉 **Risques :**
  - Documents perdus : 20% des fichiers difficiles à retrouver
  - Décisions oubliées : Pas de traçabilité
  - Doublons : Refaire ce qui a déjà été fait

#### Avec l'Application (Situation Cible)

- ⚡ **Temps de recherche :** < 10 secondes (vs 30 minutes avant)
- 📈 **Gain de productivité :** 70% de temps gagné sur la recherche documentaire
- 🎯 **Traçabilité :** 100% des décisions documentées
- 🔒 **Sécurité :** Droits d'accès maîtrisés

#### ROI (Return on Investment)

**Investissement :** 42 heures de développement (Hackathon)
**Gain :** 500 heures/mois économisées
**ROI :** Rentabilisé en **3 jours** d'utilisation

---

### 9.6 Les 5 Raisons pour Lesquelles Ce Projet DOIT Réussir

#### Raison #1 : Besoin Urgent et Réel

Ce n'est pas un projet "nice to have". C'est une **nécessité opérationnelle**. TILI souffre aujourd'hui du chaos. Chaque jour sans solution = perte de temps et d'efficacité.

#### Raison #2 : Client Engagé

_"TILI s'engage à utiliser l'outil après le hackathon"_ → Ce n'est pas un POC qui finira dans un tiroir. C'est un outil qui sera réellement utilisé.

#### Raison #3 : Périmètre Maîtrisable

Contrairement à des projets tentaculaires, celui-ci a un scope clair :

- 3 entités principales (Users, Documents, Meetings)
- 3 rôles bien définis
- 1 workflow central (Créer réunion → Rédiger CR → Lier docs)

#### Raison #4 : Impact Mesurable

On saura si ça marche :

- Nombre de documents uploadés
- Nombre de recherches effectuées
- Taux d'adoption (combien des 25 membres l'utilisent)

#### Raison #5 : Effet Levier

Si ça marche pour TILI, le modèle peut être répliqué pour d'autres associations. C'est un **outil open source réutilisable**.

---

### 9.7 Le Scénario du Succès (Dans 6 Mois)

**Mars 2026 (Lancement Post-Hackathon)**

- 5 utilisateurs pionniers testent l'application
- Feedback collecté, bugs mineurs corrigés

**Avril 2026**

- Déploiement à l'ensemble des 25 membres
- Formation en groupe (2 sessions de 2h)
- 300 documents migrés depuis Google Drive

**Mai 2026**

- Adoption consolidée : 80% des membres utilisent l'outil quotidiennement
- 500 documents stockés
- 30 réunions documentées

**Juin 2026**

- TILI présente son système lors d'un événement associatif
- 3 autres ONG demandent à utiliser le même outil

**Septembre 2026**

- Version 2.0 avec nouvelles fonctionnalités (notifs, calendrier)
- TILI devient une référence en gestion numérique associative

---

### 9.8 Le Scénario de l'Échec (À Éviter Absolument)

**Ce qui pourrait mal tourner :**

**Scénario A : L'Usine à Gaz**

- Trop de fonctionnalités mal finies
- Interface confuse
- Bugs multiples
  → **Résultat :** Rejet par les utilisateurs dès la première semaine

**Scénario B : Le POC Abandonné**

- MVP fonctionnel mais pas déployé
- Pas de formation des utilisateurs
- Pas de support post-lancement
  → **Résultat :** L'outil meurt après 2 semaines

**Scénario C : La Solution Partielle**

- Seulement la GED développée (pas les réunions)
- Valeur métier insuffisante
  → **Résultat :** Les utilisateurs retournent à Google Drive

**Comment Éviter :**

- Fokus sur le MVP (Les 3 features critiques)
- UX testée avec de vrais utilisateurs
- Documentation et formation incluses
- Support prévu (même minimal)

---

### 9.9 Le Message aux Développeurs

**Chers Devs,**

Vous n'allez pas juste coder une application en 42h.
Vous allez **changer la façon de travailler de 25 personnes** qui aident 5000 bénéficiaires.

Chaque ligne de code que vous écrivez a un impact réel :

- Si votre recherche est rapide → Un chef de projet gagne 30 min
- Si votre upload est simple → Un consultant ne perd plus de temps
- Si vos permissions sont sécurisées → Les données sensibles sont protégées

**Ce n'est pas qu'un challenge technique. C'est une mission.**

Votre code peut transformer le chaos en ordre.
Votre UX peut réduire la frustration.
Votre attention aux détails peut créer de la confiance.

**N'oubliez jamais : Derrière chaque `<button>`, il y a un humain.**

---

### 9.10 Le Message au Client (TILI)

**Chère Équipe TILI,**

Cet outil que nous allons construire est **votre outil**.
Il ne remplacera pas vos processus, il les **amplifiera**.

**Ce qu'il fera :**
✅ Retrouver un document en 10 secondes (vs 30 minutes)
✅ Documenter chaque décision importante
✅ Structurer votre mémoire collective

**Ce qu'il ne fera pas :**
❌ Remplacer la communication humaine
❌ Penser à votre place
❌ Fonctionner sans engagement de votre part

**Pour que ça marche, nous avons besoin de vous :**

1. **Avant le dev :** Clarifier vos besoins (2h d'atelier)
2. **Pendant le dev :** Valider nos choix (3 checkpoints)
3. **Après le dev :** Utiliser l'outil quotidiennement (engagement)

**Si vous jouez le jeu, nous créerons ensemble un outil dont vous serez fiers.**

---

### 9.11 La Vision Long Terme

**Ce Projet Aujourd'hui :**
Une application pour TILI (25 membres, 5000 bénéficiaires)

**Ce Projet Demain :**

- Une solution open source pour le secteur associatif tunisien
- Un modèle de gestion documentaire adapté aux ONG
- Un cas d'école de digitalisation associative

**Ce Projet Dans 5 Ans :**

- 100 associations l'utilisent
- 10 000 membres impactés
- 1 million de documents organisés
- Une contribution significative à la transformation digitale du secteur social

---

### 9.12 Conclusion : L'Équation Finale

```
Ce Projet = Technologie × Humain × Engagement

Où :
- Technologie ≠ Complexe (mais Simple et Robuste)
- Humain ≠ Utilisateur (mais Bénéficiaire de l'impact)
- Engagement ≠ 42h (mais Long Terme)
```

**La vraie réussite ne se mesure pas le dernier jour du hackathon.**
**Elle se mesure 6 mois après, quand TILI ne peut plus s'en passer.**

---

### 9.13 Le Dernier Mot (Citation Inspirante)

> _"Les meilleurs projets ne sont pas ceux qui ont le code le plus élégant,  
> mais ceux qui résolvent les vrais problèmes des vraies personnes."_  
> — **Paul Graham**, Fondateur Y Combinator

**Vous avez 42 heures pour changer une organisation.  
Utilisez-les sagement. 🚀**

---

## 📊 TABLEAU DE BORD DU SUCCÈS

| Critère         | Indicateur                     | Cible MVP | Cible Idéale |
| :-------------- | :----------------------------- | :-------- | :----------- |
| **Performance** | Temps de chargement            | < 3s      | < 1s         |
| **Utilité**     | Temps de recherche             | < 10s     | < 3s         |
| **Adoption**    | % d'utilisateurs actifs J+7    | > 50%     | > 80%        |
| **Fiabilité**   | Uptime                         | > 95%     | > 99%        |
| **UX**          | Taux de complétion des actions | > 80%     | > 95%        |
| **Valeur**      | Temps gagné/user/semaine       | > 2h      | > 5h         |

**Si ces métriques sont atteintes → SUCCÈS TOTAL 🎯**

---

## 10. PRO TIPS (Mode Expert – Gestion de Projet)

### 10.1 Erreurs Fatales à Éviter (TOP 10)

#### ERREUR #1 : L'Effet "Sapin de Noël"

- **Description :** Ajouter des fonctionnalités "cool" mais non critiques
- **Exemples :**
  - Chat intégré alors que la GED ne marche pas
  - Dark Mode alors que l'upload bug
  - Animations fancy alors que les permissions ne sont pas sécurisées
- **Conséquence :** Livraison d'un produit à 40% qui ne répond pas au besoin
- **Solution :** Interdiction stricte de toute feature hors MVP avant H+30

#### ERREUR #2 : Le Backend "Passoire"

- **Description :** Sécuriser uniquement le Frontend (boutons cachés)
- **Exemple :** Un consultant ne voit pas le bouton "Supprimer user", mais peut appeler l'API `DELETE /users/:id`
- **Conséquence :** Faille de sécurité critique
- **Solution :** **Toujours** vérifier les droits côté serveur (Middleware)
- **Code Pattern :**

  ```javascript
  // ❌ MAUVAIS (Sécurité Frontend uniquement)
  if (user.role === "admin") {
    <button onClick={deleteUser}>Delete</button>;
  }

  // ✅ BON (Sécurité Backend)
  app.delete("/users/:id", requireAdmin, deleteUser);
  ```

#### ERREUR #3 : Pas de Modèle de Données Défini

- **Description :** Commencer à coder sans avoir dessiné le MCD
- **Conséquence :** Refonte complète de la BDD à H+20 (perte de 10h)
- **Solution :** Passer 2 heures à H+1 sur le MCD (Papier ou Draw.io)
- **Relations Clés à Définir :**
  - User -> Role (1:N ou N:M ?)
  - Document -> Meeting (1:N ou N:M ?)
  - Meeting -> Project (1:N)
  - User -> Document (Auteur, 1:N)

#### ERREUR #4 : Upload Non Testé Rapidement

- **Description :** Développer tout le frontend et tester l'upload à H+30
- **Conséquence :** Problèmes de CORS, taille limite, timeout
- **Solution :** Faire un "Hello World Upload" dès H+4
- **Test Minimal :**
  ```
  1. Form HTML avec input file
  2. Route Backend POST /upload
  3. Stockage dans /tmp
  4. Si ça marche → OK, sinon debug immédiatement
  ```

#### ERREUR #5 : Perfectionnisme du CSS

- **Description :** Passer 8 heures à aligner un bouton au pixel près
- **Conséquence :** Fonctionnalités critiques non développées
- **Solution :** Utiliser un **Admin Template** ou UI Kit (Gain de 15h)
- **Recommandations :**
  - Tailwind CSS + Tailwind UI (Composants prêts)
  - Material-UI (React)
  - Ant Design (React)
  - Vuetify (Vue)

#### ERREUR #6 : Pas de Déploiement Continu

- **Description :** Coder en local et déployer à H+41
- **Conséquence :** "Ça marche chez moi mais pas en prod"
- **Solution :** Déployer dès H+4 et pusher régulièrement
- **Workflow :**
  - H+4 : Déployer le "Hello World"
  - Toutes les 4h : Push et redéploiement automatique
  - H+40 : Environnement stable et testé

#### ERREUR #7 : Communication Défaillante

- **Description :** Backend et Frontend ne se parlent pas
- **Exemple :** Frontend attend un `userId`, Backend envoie `user_id`
- **Conséquence :** 3 heures perdues en debugging
- **Solution :** Définir le contrat d'API dès H+2
- **Outil :** Swagger/OpenAPI ou simple Google Doc partagé

#### ERREUR #8 : Pas de Données de Test

- **Description :** Tester avec 1 user et 2 documents
- **Conséquence :** Bugs de pagination/performance invisibles
- **Solution :** Créer un script de seed avec :
  - 20 utilisateurs
  - 100 documents
  - 15 réunions
  - 5 projets

#### ERREUR #9 : Négliger la Démo

- **Description :** "On verra le jour J ce qu'on montre"
- **Conséquence :** Démo chaotique, bugs en live
- **Solution :**
  - H+38 : Rédiger le script de démo
  - H+39 : Répétition chronométrée (10 min max)
  - H+40 : Enregistrer une vidéo backup

#### ERREUR #10 : Épuisement de l'Équipe

- **Description :** 42h non-stop sans pause
- **Conséquence :** Baisse de productivité, bugs, tensions
- **Solution :**
  - Pauses imposées : 2h toutes les 8h
  - Rotation des tâches (ne pas faire 15h de CSS)
  - Nourriture et hydratation régulières

---

### 10.2 Points Critiques à Valider Dès le Début

#### À H+0 (Kick-off)

**1. Clarification du Périmètre**

- [ ] Réunion avec le client (Mme Asma) - 1h
- [ ] Liste des questions posées et réponses notées
- [ ] Flous identifiés et résolus
- [ ] MVP défini et validé par tous

**2. Choix de la Stack**

- [ ] Vote équipe sur Frontend (React/Vue/Angular)
- [ ] Vote équipe sur Backend (Node/Laravel/Django)
- [ ] Choix de la BDD (PostgreSQL recommandé)
- [ ] Tout le monde d'accord (pas de débat après)

#### À H+2 (Architecture)

**3. Modèle Conceptuel de Données (MCD)**

- [ ] Dessiné sur papier ou Draw.io
- [ ] Relations clairement définies
- [ ] Validation équipe (pas d'ambiguïté)
- [ ] MCD affiché dans l'espace de travail (référence permanente)

**4. Contrat d'API**

- [ ] Liste de tous les endpoints nécessaires
- [ ] Format des requêtes/réponses (JSON Schema)
- [ ] Codes d'erreur standardisés
- [ ] Document partagé accessible à tous

**5. Mockups Validés**

- [ ] Wireframes des 5 écrans principaux
- [ ] Validation UX avec un externe (si possible)
- [ ] Design System défini (couleurs, typo)

#### À H+4 (Avant Code Intensif)

**6. Environnement de Développement**

- [ ] Tout le monde a le repo cloné
- [ ] Backend lance localhost sans erreur
- [ ] Frontend lance localhost sans erreur
- [ ] BDD connectée et accessible

**7. Test de la Chaîne Critique**

- [ ] Upload de fichier fonctionne (bout en bout)
- [ ] Authentification fonctionne (création session)
- [ ] Connexion BDD fonctionnelle (INSERT/SELECT)

**8. Déploiement Initial**

- [ ] Backend déployé sur Heroku/Render
- [ ] Frontend déployé sur Vercel/Netlify
- [ ] URL publique accessible
- [ ] CI/CD configuré (auto-deploy)

---

### 10.3 Conseils pour Réussir Plus Vite

#### A. Techniques de Développement

**1. Utiliser des Générateurs de Code**

- **Backend :**
  - Prisma Schema → Génère les modèles
  - Laravel Artisan → Génère controllers/models
  - Django Admin → Interface admin gratuite
- **Frontend :**
  - Create-T3-App (React + TypeScript + tRPC + Prisma)
  - Vue CLI (Scaffolding complet)
  - Create-React-App + Template

**2. Copier-Coller Intelligent**

- Ne réinventez pas la roue
- Exemples de code réutilisable :
  - Middleware d'authentification (GitHub)
  - Upload de fichiers (Stack Overflow)
  - Formulaires avec validation (Sandbox CodeSandbox)
- **Attention :** Comprendre avant de coller

**3. Pair Programming sur les Points Bloquants**

- Si bloqué > 30 min → Demander de l'aide
- 2 cerveaux > 1 cerveau
- Surtout pour : Auth, Upload, Permissions

**4. Time-boxing Strict**

- Allouer un temps MAX par tâche
- Exemple :
  - Authentification : Max 4h
  - Upload : Max 6h
  - Dashboard : Max 4h
- Si dépassement → Escalade au chef de projet

#### B. Astuces UX/UI

**5. Utiliser un Admin Template**

- **Gratuits et Pro :**
  - [AdminLTE](https://adminlte.io/) - Bootstrap
  - [CoreUI](https://coreui.io/) - Multiple frameworks
  - [Tabler](https://tabler.io/) - Clean et moderne
  - [Ant Design Pro](https://pro.ant.design/) - React
- **Avantage :** Interface pro en 30 minutes

**6. Design System Minimaliste**

- 3 couleurs maximum :
  - Primaire (Actions) : Bleu
  - Secondaire (Infos) : Gris
  - Danger (Suppression) : Rouge
- 2 polices :
  - Titres : Inter / Roboto
  - Texte : System Font (rapide)

**7. Icons Standardisés**

- Utiliser une librairie unique :
  - Font Awesome (Universelle)
  - Heroicons (Moderne, Tailwind)
  - Material Icons (Si Material-UI)
- Ne pas mélanger plusieurs librairies

#### C. Optimisations Techniques

**8. Pagination Obligatoire**

- Jamais de `SELECT * FROM documents` sans LIMIT
- Toujours paginer :
  - Liste documents : 20 par page
  - Liste réunions : 15 par page
  - Historique : 50 par page

**9. Messages d'Erreur Clairs**

- ❌ "Error"
- ✅ "Le fichier est trop large (max 10 MB)"
- ❌ "500 Internal Server Error"
- ✅ "Impossible d'uploader le fichier. Réessayez."

**10. Loaders Partout**

- Chaque action asynchrone = Loader
- Upload en cours : Barre de progression
- Chargement liste : Skeleton ou Spinner
- Feedback immédiat = Bonne UX

---

### 10.4 Ce que Ferait un Chef de Projet Senior (Semaine 1)

#### Jour 1 (H+0 à H+8)

**Heure 0 : Réunion de Cadrage (1h)**

- Lecture collective du CDC
- Identification des zones d'ombre
- Appel avec le client (30 min)
- Validation du périmètre MVP

**Heure 1 : Définition du "North Star"**

- Rédiger en 1 phrase : "Ce projet réussit si..."
- Exemple : _"Ce projet réussit si un chef de projet peut créer une réunion, écrire le CR et lier des docs en moins de 5 minutes"_
- Afficher cette phrase dans l'espace de travail

**Heure 2 : Architecture Technique (2h)**

- Choix de stack (Vote, pas débat infini)
- Dessin du MCD (Papier)
- Définition des API endpoints
- Validation collective

**Heure 4 : Setup & Déploiement (2h)**

- Création des repos GitHub
- Setup environnements locaux
- Premier déploiement (Hello World)
- Vérification que tout le monde peut contribuer

**Heure 6 : Mockups (2h)**

- Wireframes papier des 5 écrans clés
- Validation UX
- Choix du template UI
- Début du dev

#### Jour 2 (H+8 à H+16)

**Matin : Développement Intensif**

- Focus sur le MVP Core (Auth + GED)
- Standup à H+8 (15 min)
- Code Review mutuelle

**Après-midi : Premier Livrable**

- À H+16, on doit pouvoir :
  - Se connecter
  - Uploader un fichier
  - Le voir dans une liste
- Si ce n'est pas le cas → Pivot

#### Jour 3 (H+16 à H+24)

**Matin : Module Réunions**

- Développement du cycle complet
- Tests de bout en bout

**Après-midi : Recherche + Polish**

- Ajout de la recherche
- Amélioration UX (erreurs, loaders)
- Tests cross-browser

#### Jour 4 (H+24 à H+32)

**Matin : Fonctionnalités Avancées**

- Projets (si le temps)
- Dashboard
- Notifications (si le temps)

**Après-midi : Premier Gel de Code**

- À H+30, on arrête les nouvelles features
- Focus sur la stabilisation

#### Jour 5 (H+32 à H+42)

**Matin : Tests Intensifs**

- Tests manuels exhaustifs
- Correction des bugs critiques
- Seed de données de démo

**Après-midi : Préparation Démo**

- Rédaction du script
- Répétition (x3)
- Enregistrement vidéo backup
- Déploiement final

---

### 10.5 Checklist du Chef de Projet (Suivi Quotidien)

#### Chaque 8 Heures (Daily Standup)

**Questions à poser à chaque membre :**

1. Qu'as-tu fini depuis le dernier standup ?
2. Sur quoi travailles-tu maintenant ?
3. As-tu un bloqueur ?

**Actions CP :**

- [ ] Mettre à jour le Kanban Board
- [ ] Résoudre les bloqueurs immédiatement
- [ ] Rappeler le North Star si dérive

#### À Chaque Milestone

**H+8 : Auth Fonctionnelle**

- [ ] On peut se connecter/déconnecter
- [ ] Demo rapide à l'équipe

**H+16 : GED Fonctionnelle**

- [ ] Upload + Liste + Download marchent
- [ ] Demo rapide à l'équipe

**H+24 : Réunions Fonctionnelles**

- [ ] Cycle complet d'une réunion validé
- [ ] Demo rapide à l'équipe

**H+36 : Stabilisation**

- [ ] Zéro bugs critiques
- [ ] UX propre

**H+42 : Show Time**

- [ ] Démo fluide et convaincante

---

### 10.6 Signaux d'Alerte (Red Flags)

#### 🚩 Si à H+12, l'upload ne marche pas

→ **STOP EVERYTHING** et tout le monde debug l'upload

#### 🚩 Si à H+20, aucun écran n'est terminé

→ **PIVOT** : Réduire le périmètre drastiquement

#### 🚩 Si un membre de l'équipe code 12h sans pause

→ **PAUSE FORCÉE** : 2h de repos obligatoire

#### 🚩 Si le Frontend et Backend ne communiquent pas à H+16

→ **RÉUNION URGENTE** : Débloquer la situation

#### 🚩 Si pas de déploiement à H+24

→ **PRIORITÉ MAX** : Déployer immédiatement

---

### 10.7 Outils Secrets des Pros

#### A. Productivité

**1. Pomodoro en Équipe**

- 45 min de focus intense
- 15 min de pause collective
- Alarme commune

**2. Music Sync (Optionnel)**

- Playlist partagée (Lo-fi, Instrumental)
- Crée une ambiance de flow

**3. Pair Timer**

- Pour le pair programming
- 25 min pour chaque développeur au clavier

#### B. Qualité

**4. AI Assistants**

- GitHub Copilot (Autocomplétion)
- ChatGPT (Debug de code)
- **Attention :** Vérifier le code généré

**5. Linters Configurés Dès H+0**

- ESLint (JavaScript)
- Prettier (Formattage)
- Gain de temps sur les code reviews

**6. Précommit Hooks**

- Empêche de commit du code qui ne compile pas
- Formatage automatique

#### C. Documentation

**7. README Vivant**

- Mis à jour en continu
- Commandes pour lancer le projet
- Structure de la BDD
- Liste des APIs

**8. Inline Comments**

- Expliquer les parties complexes
- Future you will thank you

---

### 10.8 Citations de Chefs de Projet Légendaires

> "Le meilleur code est celui qu'on n'a pas eu à écrire."
> — **Principe KISS** (Keep It Simple, Stupid)

> "Si tu ne peux pas le déployer, ça n'existe pas."
> — **DevOps Wisdom**

> "Un projet sans deadline n'est jamais fini. Un projet avec une deadline est fini... ou pas."
> — **Hofstadter's Law**

> "Fail fast, fail often, but always fail forward."
> — **Silicon Valley Mantra**

> "Documentation is love letter you write to your future self."
> — **Damian Conway**

---

### 10.9 Le Mantra du Hackathon

```
1. Fait > Parfait
2. MVP > Fonctionnalités fancy
3. Démo fluide > Code élégant
4. Utilisateur heureux > Technique brillante
5. Livré > En cours
```

**Et Surtout :**

> **"Ce qui compte, c'est ce qui fonctionne lors de la démo. Le reste est anecdotique."**

---

## 🎯 RÉSUMÉ EXÉCUTIF FINAL

### En 42 heures, votre mission est de :

1. **Construire un MVP solide** (Auth + GED + Réunions)
2. **Livrer une démo convaincante** (Scénario fluide et sans bug)
3. **Prouver la valeur métier** (TILI peut l'utiliser dès demain)

### Les 3 Règles d'Or :

1. **Prioriser Impitoyablement** : Si ce n'est pas dans le scénario de démo, ne le codez pas
2. **Tester Continuellement** : Déployez et testez toutes les 4 heures
3. **Communiquer Sans Relâche** : Standup, Documentations, Validations

### Le Secret du Succès :

> Ce n'est pas l'équipe qui code le plus qui gagne.  
> C'est l'équipe qui **livre** le plus de valeur avec le moins de code.

**Bonne chance ! 🚀**

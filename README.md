# Kija — Location & réservation immobilière

Site de location et réservation de biens immobiliers avec :
- une partie **publique** : biens en courte durée (prix/nuit, dates d'arrivée-départ) ou longue durée (prix/mois, date d'emménagement souhaitée), classés par catégorie (Appartement, Villa, Studio...), avec photos/description, et un formulaire de **demande de réservation** enregistré en base ;
- une partie **administrateur** (`/admin`) avec plusieurs comptes possibles : gestion des biens, des catégories, des **réservations** (confirmer/refuser une demande), du logo et du contenu du site, et de l'équipe d'administrateurs (avec des droits différents pour chacun).

## Configuration

Les réglages sont dans le fichier `.env` à la racine du projet :

```
DATABASE_URL="file:./dev.db"
WHATSAPP_NUMBER="221xxxxxxxxx"      # numéro de l'agence, format international
ADMIN_EMAIL="admin@agence.com"      # email du compte administrateur "propriétaire"
ADMIN_PASSWORD="..."                # mot de passe de ce compte propriétaire
SESSION_SECRET="..."                # chaîne secrète aléatoire (à changer en prod)

# Envoi d'emails (notifie un administrateur de son nouveau mot de passe temporaire)
SMTP_HOST=""
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASSWORD=""
SMTP_FROM=""
```

Le numéro WhatsApp peut être saisi avec ou sans "+" et espaces, il est nettoyé automatiquement.
`ADMIN_EMAIL`/`ADMIN_PASSWORD` ne servent qu'à créer le tout premier compte administrateur (le "propriétaire") lors du `npm run db:seed` initial ; ensuite, tous les comptes se gèrent depuis `/admin/administrateurs`.

Les champs `SMTP_*` sont optionnels : s'ils sont vides, aucun email n'est envoyé (le mot de passe temporaire reste affiché à l'écran lors de l'approbation, voir plus bas). Pour les activer, par exemple avec Gmail : `SMTP_HOST="smtp.gmail.com"`, `SMTP_PORT="587"`, `SMTP_USER` = l'adresse Gmail, `SMTP_PASSWORD` = un [mot de passe d'application](https://myaccount.google.com/apppasswords) Google (pas le mot de passe du compte). N'importe quel autre fournisseur SMTP (Brevo, Mailgun, Resend, OVH, ...) fonctionne aussi.

## Installation (première fois)

```bash
npm install
npm run db:push
npm run db:seed
```

`db:push` crée la base de données à partir du schéma. `db:seed` crée les catégories de départ (**Appartements**, **Villas**, **Studios**, **Maisons**), initialise les paramètres du site, et crée le compte administrateur **propriétaire** à partir de `ADMIN_EMAIL`/`ADMIN_PASSWORD` (uniquement s'il n'existe pas déjà).

## Lancer le site en développement

```bash
npm run dev
```

Puis ouvrir http://localhost:3000 (site public) et http://localhost:3000/admin (espace admin, connexion avec `ADMIN_EMAIL` / `ADMIN_PASSWORD`).

## Utilisation de l'espace admin

- **Catégories** (`/admin/categories`) : créer/supprimer des catégories de biens (Appartement, Villa, Studio, Maison, Bureau, ...). Une catégorie contenant encore des biens ne peut pas être supprimée.
- **Propriétés** (`/admin/proprietes`) : ajouter un bien avec titre, catégorie, type de location (courte durée = prix/nuit, ou longue durée = prix/mois), ville, adresse, chambres, salles de bain, surface, description et une ou plusieurs photos ; modifier ou supprimer un bien existant.
- **Réservations** (`/admin/reservations`) : chaque demande de réservation soumise depuis la fiche d'un bien est enregistrée en base avec le statut **en attente**. Les administrateurs ayant le droit "Gérer les réservations" peuvent la **confirmer** ou la **refuser** ; un badge sur le menu affiche le nombre de demandes en attente.
- **Contenu du site** (`/admin/parametres`) : changer le logo, le nom de l'agence, la description courte (affichée en page d'accueil et en pied de page) et le texte de la page publique `/a-propos`.
- **Administrateurs** (`/admin/administrateurs`) : ajouter d'autres comptes administrateurs (nom, email, mot de passe temporaire) et choisir précisément ce que chacun peut gérer parmi : Biens, Catégories, Réservations, Contenu du site, Administrateurs. Le compte **propriétaire** (créé au seed) a toujours tous les droits et ne peut pas être supprimé ; un administrateur ne peut pas supprimer son propre compte.

### Première connexion et mot de passe oublié

- Un compte nouvellement créé (ou dont le mot de passe vient d'être réinitialisé) est marqué "doit changer son mot de passe". À sa première connexion, la personne arrive sur une page "Bienvenue" où elle peut **soit choisir un nouveau mot de passe, soit conserver** celui qui lui a été communiqué.
- Depuis la page de connexion, le lien **"Mot de passe oublié ?"** envoie vers `/admin/mot-de-passe-oublie` : la personne saisit son email, une demande est enregistrée (aucune information sur l'existence du compte n'est révélée à ce stade, pour la sécurité).
- Les administrateurs ayant le droit **"Gérer les administrateurs"** voient un badge sur le lien *Administrateurs* du menu, et une section dédiée en haut de `/admin/administrateurs` listant les demandes en attente avec les boutons **Approuver** / **Rejeter**.
- En approuvant, un nouveau mot de passe temporaire est généré, **envoyé par email** à la personne concernée (si `SMTP_*` est configuré) et affiché à l'écran à l'administrateur qui approuve (au cas où l'email échoue, ou pour ses archives). Le compte est de nouveau marqué "doit changer son mot de passe" pour ce nouveau mot de passe.

### Confirmations avant suppression

Toute suppression (catégorie, bien, photo d'un bien, administrateur) affiche d'abord une boîte de dialogue de confirmation du navigateur, pour éviter les clics accidentels. Seules les personnes ayant le droit correspondant (ex. "Gérer les catégories" pour supprimer une catégorie) voient même apparaître le bouton de suppression — la confirmation s'ajoute à cette vérification de droits, elle ne la remplace pas.

## Demande de réservation

Sur chaque fiche de bien, le bouton "Demander une réservation" ouvre un formulaire (nom, téléphone, email optionnel, dates d'arrivée/départ pour un bien en courte durée ou date d'emménagement souhaitée pour un bien en longue durée, message optionnel). La demande est enregistrée en base avec le statut **en attente**, visible immédiatement dans `/admin/reservations`. Une fois la demande envoyée, un lien WhatsApp secondaire est proposé pour prévenir directement l'agence — la donnée de référence reste toutefois la réservation en base, pas ce message WhatsApp. La fiche d'un bien inclut aussi des balises Open Graph : si le lien est partagé une fois le site en ligne sur un vrai domaine, un aperçu avec la photo du bien s'affiche automatiquement (ne fonctionne pas en local sur `localhost`).

## Notes techniques

- Stack : Next.js (App Router) + TypeScript + Tailwind CSS + Prisma (PostgreSQL).
- Les photos et le logo sont stockés sur Cloudflare R2 (voir `R2_*` dans `.env`).
- Chaque administrateur a un compte propre (email + mot de passe haché avec bcrypt) et une liste de droits stockée en base ; la session est un cookie signé (JWT) valable 7 jours ne contenant que l'identifiant du compte — les droits sont revérifiés en base à chaque page/action, donc un retrait de droit est immédiat.
- Pour la production, pensez à changer `ADMIN_PASSWORD` et `SESSION_SECRET`.

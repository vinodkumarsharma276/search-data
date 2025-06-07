# PWA Google Sheets Search

This project is a Progressive Web App (PWA) built with React that allows users to search over data stored in a Google Sheet. The app provides a native-like experience on mobile devices and includes user authentication.

## Features

- **Progressive Web App**: Can be pinned to mobile devices for a native app feel.
- **User Authentication**: Login functionality with two dummy users.
  - Username: `jagdishchand`, Password: `jagdish123`
  - Username: `vinodsharma`, Password: `vinod123`
- **Search Functionality**: After logging in, users can search through data in a Google Sheet.
- **Dynamic Filtering**: Users can filter results based on selected criteria (name, address, phone).

## Project Structure

```
pwa-google-sheets-search
├── public
│   ├── index.html
│   ├── manifest.json
│   ├── sw.js
│   └── icons
│       ├── icon-192x192.png
│       └── icon-512x512.png
├── src
│   ├── components
│   │   ├── Login.js
│   │   ├── SearchPage.js
│   │   ├── SearchBox.js
│   │   └── ResultsList.js
│   ├── services
│   │   ├── authService.js
│   │   └── googleSheetsService.js
│   ├── hooks
│   │   └── useAuth.js
│   ├── utils
│   │   └── constants.js
│   ├── styles
│   │   └── App.css
│   ├── App.js
│   └── index.js
├── package.json
├── .env
└── README.md
```

## Setup Instructions

1. **Clone the Repository**:
   ```bash
   git clone <repository-url>
   cd pwa-google-sheets-search
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory and add your Google Sheets API credentials.

4. **Run the Application**:
   ```bash
   npm start
   ```

5. **Build for Production**:
   ```bash
   npm run build
   ```

## Usage

- Open the app in your browser.
- Enter one of the dummy usernames and passwords to log in.
- After logging in, use the search box and dropdown to filter results from the Google Sheet.

## License

This project is licensed under the MIT License.
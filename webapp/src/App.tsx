import React, { useState, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  useHistory,
  useRouteMatch,
  Link,
} from 'react-router-dom';
import 'semantic-ui-css/semantic.min.css';
import queryString from 'query-string';
import './App.css';

import {
  SplashScreen,
  ProfileWidgetPlus,
  UserPage,
  NewContentWidget,
  DirectMessageModal,
  DirectMessageDialogs,
  TermsOfService,
  PrivacyPolicy,
  CookieConsentBanner,
} from './components';
import {
  CommunityMap,
  Pin,
  useAuth,
  AuthProvider,
  RenderAuthorCallback,
  postObject,
  initFirebase,
} from '@opencommunitymap/react-sdk';
import { InitialAppParams, EmbedParams } from './types';
import 'firebase/analytics';
import 'firebase/auth';
import 'firebase/firestore';
import { Modal } from 'semantic-ui-react';

const GOOGLE_API_KEY = process.env.REACT_APP_GOOGLE_API_KEY || '';
const OCM_ENV = process.env.REACT_APP_OCM_ENV || process.env.NODE_ENV;

const __initFirebase = async () => {
  return initFirebase(OCM_ENV);
  // if (process.env.NODE_ENV === 'production') {
  //   return fetch('/__/firebase/init.json').then(async (response) => {
  //     console.debug('Init firebase with default project config');
  //     firebase.initializeApp(await response.json());
  //   });
  // } else {
  //   const { firebaseConfig } = require('./firebaseConfig');
  //   console.debug('Init firebase with local config', firebaseConfig);
  //   firebase.initializeApp(firebaseConfig);
  // }
};

const FirebaseInitializer: React.FC = ({ children }) => {
  const [done, setDone] = useState(false);

  useEffect(() => {
    __initFirebase()
      .then((firebase) => {
        if (process.env.NODE_ENV === 'production') {
          firebase.analytics();
        }
        setDone(true);
      })
      .catch((err) => alert(err.message));
  }, []);

  return done ? <>{children}</> : <SplashScreen showLogo={false} />;
};

const embedBasename = '/embed';
const isEmbed = window.location.pathname.indexOf(embedBasename) === 0;
const initialParams: InitialAppParams | null = window.location.search
  ? (queryString.parse(window.location.search, {
      parseNumbers: true,
      parseBooleans: true,
    }) as any)
  : null;
const embedParams: EmbedParams | null = isEmbed
  ? {
      appId: initialParams?.appId as string,
    }
  : null;

const defaultCenter = { latitude: 42.69, longitude: 23.32 };

const renderAuthor: RenderAuthorCallback = (userId, authorInfo) => (
  <Link to={`/users/${userId}`}>{authorInfo?.name || 'Anonymous'}</Link>
);

const Home: React.FC = () => {
  const user = useAuth() || null;
  const [currentLocation, setCurrentLocation] = useState(defaultCenter);
  const router = useHistory();

  const objectRouteMatch = useRouteMatch<{ objectId: string }>(
    '/object/:objectId'
  );

  return (
    <div id="home">
      <CommunityMap
        defaultCenter={defaultCenter}
        onChange={(center) => setCurrentLocation(center)}
        mapApiKey={GOOGLE_API_KEY}
        showObjectId={objectRouteMatch?.params?.objectId}
        onClickObject={(obj) => {
          router.push(`/object/${obj.id}`);
          return true;
        }}
        onObjectModalClose={() => router.push('/')}
        centerPin={<Pin color="#2185d0" />}
        autolocate={initialParams?.autolocate}
        filterOrigin={initialParams?.filterOrigin}
        profileWidget={<ProfileWidgetPlus />}
        renderAuthor={renderAuthor}
        // renderObject={({ item }) => (item.type === 'story' ? true : null)}
      ></CommunityMap>
      {initialParams?.canAdd !== false && (
        <NewContentWidget
          authenticated={!!user}
          onAdd={(item) =>
            postObject(user, currentLocation, item, embedParams?.appId)
          }
        />
      )}

      <Switch>
        <Route path="/direct-messages/:dmKey">
          <DirectMessageModal onClose={() => router.push('/')} />
        </Route>
        <Route path="/users/:userId">
          <Modal open closeIcon size="tiny" onClose={() => router.push('/')}>
            <Modal.Content scrolling>
              <UserPage />
            </Modal.Content>
          </Modal>
        </Route>
        <Route path="/my-messages">
          <Modal open closeIcon size="tiny" onClose={() => router.push('/')}>
            <Modal.Header>Messages</Modal.Header>
            <Modal.Content scrolling>
              <DirectMessageDialogs />
            </Modal.Content>
          </Modal>
        </Route>
        <Route path="/terms">
          <Modal open closeIcon size="large" onClose={() => router.push('/')}>
            <Modal.Header>Terms of Service</Modal.Header>
            <Modal.Content scrolling>
              <TermsOfService />
            </Modal.Content>
          </Modal>
        </Route>
        <Route path="/privacy">
          <Modal open closeIcon size="large" onClose={() => router.push('/')}>
            <Modal.Header>Privacy and Cookie Policy</Modal.Header>
            <Modal.Content scrolling>
              <PrivacyPolicy />
            </Modal.Content>
          </Modal>
        </Route>
      </Switch>
    </div>
  );
};

function App() {
  const user = useAuth();

  const [splash, setSplash] = useState(!isEmbed ? true : false);
  useEffect(() => {
    setTimeout(() => setSplash(false), 2000);
  }, []);

  if (isEmbed) {
    if (!embedParams?.appId)
      return (
        <div>
          Mandatory parameter <strong>appId</strong> is missing. Read
          https://github.com/opencommunitymap/communitymap-ui#embedding for more
          information
        </div>
      );
  }

  if (splash || user === undefined) return <SplashScreen />;

  return <Home />;
}

export default () => (
  <FirebaseInitializer>
    <AuthProvider>
      <Router basename={isEmbed ? embedBasename : undefined}>
        <App />
        <CookieConsentBanner />
      </Router>
    </AuthProvider>
  </FirebaseInitializer>
);

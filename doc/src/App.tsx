import Engine from 'publicodes';
import './App.css';
import { RulePage } from '@publicodes/react-ui';
import { Link, Route, Routes, useParams } from 'react-router-dom';
import { ComponentProps, useRef } from 'react';
import ReactMardown from 'react-markdown';

// Import the model from the compiled model
import model from '../../publicodes-build';
import type { RuleName } from '../../publicodes-build/index.d.ts';

// Instantiate the publicodes engine with the model
const engine = new Engine(model, {
  strict: {
    noOrphanRule: false,
  },
});

(window as any).engine = engine;

(() => {
  const searchParams = new URLSearchParams(window.location.search);
  try {
    const serializedSituation = searchParams.get('situation');
    if (serializedSituation) {
      const situation = JSON.parse(decodeURIComponent(serializedSituation));
      engine.setSituation(situation);
    }
  } catch (err) {
    console.warn('could not set situation', err);
  }
})();

// The base URL of the application (in production, the app is served from a subdirectory of
// the github pages repository, so we need to prefix all the URLs with the subdirectory)
const baseUrl = process.env.NODE_ENV === 'development' ? '' : '/france-chaleur-urbaine-publicodes';

// The default rule to display when the user lands on the documentation
const defaultRule: RuleName = 'besoins chauffage par appartement';

function Documentation() {
  const url = useParams()['*'];
  const { current: renderers } = useRef({
    Link,
    Text: ({ children }) => <ReactMardown children={children} />,
  } as ComponentProps<typeof RulePage>['renderers']);

  return (
    <div>
      <RulePage
        documentationPath={`${baseUrl}/doc`}
        rulePath={url ?? defaultRule}
        searchBar={true}
        engine={engine}
        renderers={renderers}
        language={'fr'}
        npmPackage="@betagouv/france-chaleur-urbaine-publicodes"
      />
    </div>
  );
}

function Landing() {
  return (
    <div>
      <h1>Documentation</h1>
      <ul>
        <li>
          <Link to={`${baseUrl}/doc/${defaultRule}`}>Accéder à la documentation</Link>
        </li>
      </ul>
    </div>
  );
}

export default function App() {
  return (
    <div className="App">
      <Routes>
        <Route path={`${baseUrl}/`} element={<Landing />} />
        <Route path={`${baseUrl}/doc/*`} element={<Documentation />} />
      </Routes>
    </div>
  );
}

const fs = require('fs');
const path = require('path');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, PageBreak } = require('docx');

const categories = [
  ['Dart Programming Fundamentals', 50, 'https://dart.dev/language', [
    ['sound null safety', 'declare a value nullable with T? and handle null explicitly', 'force every value to dynamic', 'use ! on every nullable expression', 'disable static analysis'],
    ['final and const', 'use final for a value assigned once at runtime and const for a compile-time constant', 'use const for values received from an API', 'assume final objects are deeply immutable', 'use var to create a compile-time constant'],
    ['typed collections', 'use List<T>, Set<T>, and Map<K, V> to preserve element types', 'store mixed values in List<dynamic> by default', 'use Set when duplicate order entries must be retained', 'use Map without key and value types'],
    ['cascade notation', 'use .. to perform several operations on the same receiver', 'use ?. to invoke every method twice', 'use ... to replace a receiver', 'use => for mutable cascades'],
    ['extension methods', 'add focused APIs to an existing type without changing or subclassing it', 'override private members from another library', 'store per-instance mutable fields in an extension', 'replace the runtime type of an object'],
    ['factory constructors', 'use a factory when construction may return a cached instance or subtype', 'use a factory only to initialize final fields directly', 'assume a factory always creates a new object', 'call super from a redirecting factory body'],
    ['generics', 'use type parameters to keep reusable code type-safe', 'replace all type parameters with dynamic', 'assume List<Object> is a subtype of List<String>', 'use generics only for collections'],
    ['async and await', 'await a Future inside an async function and handle failures with try/catch', 'block the UI isolate until the Future completes', 'treat a Future<T> as an immediate T', 'use await only inside synchronous callbacks'],
    ['streams', 'use await for or listen to consume multiple asynchronous events', 'use a Future when an unbounded event sequence is required', 'listen repeatedly without cancelling subscriptions', 'assume every stream is broadcast'],
    ['pattern matching', 'use patterns and exhaustive switches to destructure and safely cover sealed cases', 'use a default branch to hide all missing sealed cases', 'cast every value before matching it', 'use patterns only with strings'],
  ]],
  ['Flutter Basics & Project Structure', 50, 'https://docs.flutter.dev/get-started/flutter-for/declarative', [
    ['pubspec.yaml', 'declare dependencies, assets, fonts, and package metadata in pubspec.yaml', 'register widgets in AndroidManifest.xml', 'place Dart dependencies in analysis_options.yaml', 'store secrets safely in pubspec.yaml'],
    ['lib/main.dart', 'use main as the Dart entry point and call runApp with the root widget', 'create the render tree before main executes', 'call runApp once per screen', 'put platform signing keys in main.dart'],
    ['hot reload', 'use hot reload to inject source changes while generally preserving app state', 'expect hot reload to rerun native startup code', 'use hot reload to validate release performance', 'assume all global initializer changes are reapplied'],
    ['BuildContext', 'treat BuildContext as a handle to a widget location in the element tree', 'store one global BuildContext forever', 'use a context above a provider to read that provider', 'use context after an async gap without checking mounted'],
    ['assets', 'declare an asset in pubspec.yaml and load it through the asset bundle', 'load arbitrary undeclared files with AssetImage', 'put all assets in the lib directory only', 'reference Windows paths in asset declarations'],
    ['themes', 'centralize visual defaults with ThemeData and read them from the nearest Theme', 'hard-code colors in every widget', 'use Theme.of with a context above MaterialApp to read its theme', 'recreate MaterialApp for every themed control'],
    ['packages and plugins', 'choose a plugin when platform-specific implementation is required', 'assume every Dart package contains native code', 'edit package cache source as normal workflow', 'ignore supported-platform declarations'],
    ['debug profile release', 'use profile mode for performance analysis and release mode for deployment', 'benchmark production performance in debug mode', 'expect asserts to remain enabled in release', 'ship profile builds to app stores'],
    ['platform channels', 'use a platform channel when Dart must communicate with host-platform code', 'use BuildContext to invoke Kotlin directly', 'place Swift code in pubspec.yaml', 'use channels for ordinary widget composition'],
    ['lints', 'configure static analysis and lints to catch issues consistently before runtime', 'use lints to replace all tests', 'disable analyzer errors in CI', 'put lint rules in AndroidManifest.xml'],
  ]],
  ['Widget (Stateless & Stateful)', 70, 'https://docs.flutter.dev/ui', [
    ['StatelessWidget', 'use StatelessWidget when output depends only on immutable configuration and inherited state', 'store mutable counters as fields in StatelessWidget', 'call setState from StatelessWidget', 'use it only for text'],
    ['StatefulWidget', 'keep mutable state in the associated State object while the widget remains immutable', 'mutate final widget fields', 'create a new State object in every build', 'put all application state in one widget'],
    ['setState', 'perform the synchronous state mutation inside setState so Flutter schedules a rebuild', 'make the setState callback async', 'call setState after dispose', 'call setState for changes that never affect UI'],
    ['initState', 'initialize one-time State resources and then call or rely on super.initState correctly', 'read changing inherited dependencies exclusively in initState', 'start a new subscription on every build', 'call initState manually'],
    ['didChangeDependencies', 'react when an inherited dependency used by State changes', 'dispose controllers here permanently', 'call it only from application code', 'assume it runs exactly once'],
    ['didUpdateWidget', 'update subscriptions when the parent supplies a new widget configuration', 'compare the new widget with itself only', 'allocate a new State for every property change', 'call dispose before every update'],
    ['dispose', 'cancel subscriptions and dispose owned controllers in dispose', 'start timers in dispose', 'call setState after super.dispose', 'dispose objects owned by a parent indiscriminately'],
    ['keys', 'use keys to preserve the intended element/state identity when siblings move or reorder', 'add a unique GlobalKey to every widget', 'use changing random keys to preserve state', 'expect keys to make rendering free'],
    ['InheritedWidget', 'expose data efficiently to descendants and notify dependents when relevant data changes', 'pass data only to ancestors', 'mutate inherited widget fields', 'read it without a descendant context'],
    ['const widgets', 'use const constructors where inputs are compile-time constants to reduce needless object creation', 'mark runtime API data const', 'expect const to prevent all descendant rebuilds', 'replace keys with const'],
  ]],
  ['Layout & Responsive UI', 60, 'https://docs.flutter.dev/ui/layout', [
    ['constraints', 'remember that constraints flow down, sizes flow up, and parents set positions', 'let children choose any size regardless of constraints', 'treat pixels as identical on all screens', 'return infinite size from every render object'],
    ['Row and Column', 'use Expanded or Flexible when a flex child must share bounded main-axis space', 'place an unconstrained wide child in Row and ignore overflow', 'wrap every child with Positioned', 'use Column for horizontal layout'],
    ['Expanded and Flexible', 'use Expanded for tight remaining space and Flexible when the child may be smaller', 'use Expanded inside an unbounded main axis', 'assume Flexible always fills all space', 'use both only in Stack'],
    ['Stack', 'use Stack with Positioned for controlled overlap relative to the stack', 'use Expanded as a direct Stack child for positioning', 'expect Stack to scroll automatically', 'use Stack as the only responsive layout'],
    ['MediaQuery', 'use MediaQuery for window metrics and prefer layout constraints for local component decisions', 'cache screen size globally forever', 'use physical pixels as logical pixels', 'read MediaQuery above the app binding'],
    ['LayoutBuilder', 'use LayoutBuilder to adapt a subtree based on the constraints it actually receives', 'use it to query API response size', 'ignore maxWidth when building responsive components', 'rebuild the entire app manually on rotation'],
    ['ListView.builder', 'lazily build large list items with ListView.builder', 'create thousands of children eagerly in a Column', 'nest it unbounded inside Column without constraints', 'use itemBuilder to mutate global state'],
    ['GridView', 'select a grid delegate that defines fixed count or maximum cross-axis extent', 'use GridView without bounded height inside Column', 'use MainAxisAlignment to set grid column count', 'expect grids to virtualize when shrinkWrap creates all content'],
    ['slivers', 'compose custom scrolling effects with CustomScrollView and sliver widgets', 'place ordinary Box widgets directly as slivers', 'nest many primary scroll views for one gesture', 'use SliverList outside a sliver viewport'],
    ['SafeArea and accessibility', 'respect system insets, text scaling, semantics, and adequate touch targets', 'disable text scaling to avoid layout work', 'encode meaning using color alone', 'place controls under system UI intentionally'],
  ]],
  ['Navigation & Routing', 40, 'https://docs.flutter.dev/ui/navigation', [
    ['Navigator push/pop', 'push a route for a new screen and pop it to return an optional result', 'replace the entire app for each screen', 'call pop on a context without a Navigator', 'use push to remove all prior routes'],
    ['named routes', 'keep route names and argument contracts consistent when using named navigation', 'assume route arguments are compile-time typed automatically', 'generate names from user input', 'use named routes as the only deep-link solution'],
    ['Router', 'use Router-based declarative navigation for advanced deep links and web URL synchronization', 'mix URL state and UI state without a source of truth', 'use Navigator 2 APIs only for dialogs', 'manually mutate browser history from widgets'],
    ['deep links', 'parse external locations into validated navigation state and support restoration', 'trust every parameter without validation', 'ignore authentication before opening protected content', 'discard the URL after app launch'],
    ['nested navigation', 'give independent tab flows their own nested Navigator when back stacks must be preserved', 'share one random GlobalKey among navigators', 'always pop the root for inner-screen back', 'rebuild tabs with new keys on every tap'],
    ['route results', 'await the Future returned by push to receive a value supplied by pop', 'read a pop result synchronously before navigation', 'return values through BuildContext mutation', 'use setState on the disposed route'],
    ['replacement and clearing', 'use replacement or remove-until semantics deliberately for login/logout flows', 'leave authenticated screens reachable after logout', 'call push repeatedly to clear history', 'remove routes using random predicates'],
    ['restoration', 'use restorable navigation APIs and restoration IDs when process-death recovery matters', 'expect ordinary local variables to survive process death', 'serialize BuildContext', 'restore sensitive sessions without revalidation'],
  ]],
  ['State Management', 60, 'https://docs.flutter.dev/data-and-backend/state-mgmt/intro', [
    ['ephemeral vs app state', 'keep short-lived local UI state near its widget and share durable app state deliberately', 'put hover state in a remote database', 'make every variable global', 'treat server cache and text-field focus identically'],
    ['ChangeNotifier Provider', 'notify listeners after a meaningful model change and scope the provider appropriately', 'create the notifier repeatedly inside build', 'mutate state without notification', 'use context.read when UI must react'],
    ['selective rebuilds', 'select or watch only the state slice a widget renders to limit rebuilds', 'watch the entire application model everywhere', 'call notifyListeners from build', 'use a GlobalKey as a state store'],
    ['Riverpod providers', 'model dependencies as providers and let ref watch reactive values', 'use ref.read in build when updates must rebuild UI', 'store Ref globally beyond its lifecycle', 'manually instantiate every provider dependency'],
    ['Riverpod autoDispose', 'use auto-disposal for resources whose lifetime should follow listeners and preserve only when justified', 'assume every provider lives forever', 'close shared resources while still observed', 'keep UI controllers in global providers by default'],
    ['Bloc events and states', 'transform events into immutable states and keep rendering driven by state', 'perform repository calls directly in every widget build', 'mutate the same state object silently', 'emit UI widgets from the business layer'],
    ['Cubit', 'use Cubit methods for simpler explicit state transitions without a separate event type', 'call emit after the Cubit is closed', 'store BuildContext in Cubit', 'use Cubit only for network code'],
    ['GetX lifecycle', 'scope controllers and reactive values so their disposal and ownership are predictable', 'register permanent global controllers for every screen', 'mix navigation, data, and UI without boundaries', 'update ordinary values and expect reactive rebuilds'],
    ['immutable state', 'create new immutable state values so changes are explicit and comparable', 'mutate shared lists behind an unchanged state reference', 'expose writable collections publicly', 'use BuildContext as the domain state'],
    ['side effects', 'handle one-off navigation, dialogs, and messages separately from pure UI state rendering', 'trigger navigation every time build runs', 'store Snackbar widgets in a repository', 'emit the same effect indefinitely'],
  ]],
  ['Networking & REST API', 40, 'https://docs.flutter.dev/cookbook/networking/fetch-data', [
    ['HTTP status handling', 'validate status codes and map successful bodies and failures explicitly', 'decode every response as success', 'retry all 4xx responses forever', 'show raw stack traces to users'],
    ['JSON serialization', 'convert JSON at the data boundary with validated typed models or generated serializers', 'pass Map<String, dynamic> through every layer', 'cast nullable keys with ! blindly', 'perform JSON parsing in widget build'],
    ['timeouts and cancellation', 'set reasonable timeouts and cancel obsolete requests when the client supports it', 'leave every request pending forever', 'retry without limits or backoff', 'cancel shared requests for unrelated consumers'],
    ['Dio interceptors', 'use interceptors for cross-cutting concerns such as auth headers and safe logging', 'refresh a token recursively with the same interceptor guard missing', 'log passwords and tokens', 'put page layout in an interceptor'],
    ['authentication tokens', 'store tokens appropriately, send them over TLS, and coordinate refresh safely', 'embed production tokens in source code', 'send credentials over plain HTTP', 'start a refresh request for every concurrent failure'],
    ['offline and caching', 'define freshness and invalidation rules instead of treating cached data as always current', 'cache every response forever', 'silently overwrite user changes', 'use UI widgets as cache entries'],
    ['isolate parsing', 'move expensive parsing off the UI isolate when profiling shows frame impact', 'spawn isolates for tiny constants', 'send unsendable objects between isolates', 'parse large payloads in every build'],
    ['API architecture', 'hide transport details behind a data source or repository contract', 'call Dio from domain entities', 'return Response objects throughout the UI', 'couple every screen to endpoint paths'],
  ]],
  ['Local Storage & Database', 30, 'https://docs.flutter.dev/cookbook/persistence', [
    ['SharedPreferences', 'use it for small non-sensitive key-value preferences, not as a relational database', 'store passwords as plain text', 'use it for large binary files', 'expect multi-record transactions'],
    ['secure storage', 'use platform-backed secure storage for secrets and still minimize stored sensitive data', 'put access tokens in source control', 'assume base64 is encryption', 'store secrets in ordinary logs'],
    ['SQLite schema', 'model relational data with keys, constraints, indexes, and explicit migrations', 'drop all user data on every version change', 'build SQL with untrusted string interpolation', 'omit transactions for multi-step atomic writes'],
    ['SQLite transactions', 'wrap related writes in a transaction so they commit or roll back together', 'run each dependent write independently', 'perform long network calls while locking the database', 'ignore transaction failures'],
    ['Hive boxes', 'use typed adapters and planned schema evolution for structured Hive values', 'change field identifiers casually', 'store BuildContext in a box', 'assume Hive queries behave like SQL joins'],
    ['repository abstraction', 'keep storage implementation details behind an interface used by higher layers', 'import sqflite in presentation widgets', 'return database cursors as domain models', 'duplicate migration logic across screens'],
  ]],
  ['Firebase Integration', 30, 'https://firebase.google.com/docs/flutter', [
    ['Firebase initialization', 'initialize Firebase before using plugins and use generated platform options where applicable', 'call a plugin before binding initialization', 'commit private server keys into the app', 'initialize a new app in every build'],
    ['Authentication state', 'listen to the appropriate auth-state stream and enforce authorization on the backend too', 'treat hidden buttons as access control', 'store user passwords locally', 'assume a cached UID grants database access'],
    ['Firestore modeling', 'design documents and queries together while accounting for indexes and document limits', 'model every relation as an unbounded array', 'download a whole collection for one record', 'assume queries support arbitrary joins'],
    ['Firestore security rules', 'write least-privilege rules using authenticated identity and validate incoming data', 'deploy allow read, write: if true', 'trust client-side validation alone', 'put an Admin SDK private key in Flutter'],
    ['Firestore listeners', 'cancel listeners when no longer needed and surface cache/server/error states clearly', 'open a new listener on every build', 'ignore snapshot errors', 'assume offline data is always current'],
    ['Cloud Storage', 'authorize paths with Storage Rules and validate file type and size on trusted boundaries', 'make every upload public', 'use filenames as proof of content type', 'download huge files fully into memory by default'],
    ['FCM handling', 'handle foreground, background, and terminated flows and keep background handlers top-level', 'update widget state directly from a background isolate', 'assume notification permission is never needed', 'put sensitive data in notification payloads'],
    ['emulators', 'use the Local Emulator Suite for repeatable development and rules testing', 'test destructive writes only in production', 'assume emulator configuration ships itself safely', 'skip rules tests when UI tests pass'],
  ]],
  ['Testing, Performance & Deployment', 70, 'https://docs.flutter.dev/testing/overview', [
    ['unit tests', 'test isolated business logic with deterministic fakes at fast feedback speed', 'require a real device for every pure function', 'assert private implementation details only', 'share mutable state across tests'],
    ['widget tests', 'pump a widget, interact through finders, and verify rendered behavior', 'call production payment services', 'depend on arbitrary sleep delays', 'test only screenshots with no behavior assertions'],
    ['integration tests', 'cover critical end-to-end flows on representative targets while keeping the suite focused', 'replace all unit tests with end-to-end tests', 'assume one emulator represents all devices', 'use production accounts and irreversible data'],
    ['test doubles', 'prefer fakes or mocks at architectural boundaries and verify observable outcomes', 'mock every value object', 'couple tests to internal call order unnecessarily', 'let network randomness determine results'],
    ['golden tests', 'use golden tests for stable visual regressions with controlled fonts, size, and platform', 'expect goldens to prove business correctness', 'update baselines without reviewing changes', 'run with uncontrolled animations'],
    ['frame performance', 'profile in profile mode and keep expensive work out of build and the UI isolate', 'optimize only from debug-mode impressions', 'rebuild the entire app for a local change', 'allocate large images at original size always'],
    ['lists and images', 'build long lists lazily and decode/cache images near their display dimensions', 'use a Column for ten thousand rows', 'disable image caching globally', 'load full-resolution images for thumbnails'],
    ['Clean Architecture', 'keep dependency direction toward business rules and isolate frameworks at boundaries', 'make domain entities import Flutter widgets', 'put SQL and UI code in one class', 'add layers even when they have no responsibility'],
    ['MVVM', 'let Views render state and forward intent while ViewModels coordinate presentation logic', 'store BuildContext permanently in every ViewModel', 'return widgets from repositories', 'perform database migrations in the View'],
    ['dependency injection', 'inject abstractions at composition boundaries to improve substitution and testing', 'create concrete services inside every method', 'use a service locator as hidden global state everywhere', 'inject BuildContext into domain entities'],
    ['release signing', 'protect signing credentials, configure release signing, and never commit private keys', 'reuse debug signing for store production', 'embed keystore passwords in public source', 'sign an iOS archive with an Android keystore'],
    ['store deployment', 'use versioning, staged rollout, monitoring, and platform-specific store requirements', 'ship without testing a release build', 'increase version only after store rejection', 'assume Android and iOS signing workflows are identical'],
    ['obfuscation symbols', 'retain split debug symbols when obfuscating so production stack traces can be symbolicated', 'delete all symbols immediately', 'expect obfuscation to encrypt secrets', 'use obfuscation instead of server authorization'],
    ['accessibility and quality', 'include semantics and test keyboard, screen reader, contrast, and text scaling behavior', 'disable accessibility in release', 'use color as the only error signal', 'assume widget tests guarantee accessibility'],
  ]],
];

const levelFor = (local, count) => local < Math.round(count * .3) ? 'Dễ' : local < Math.round(count * .8) ? 'Trung bình' : 'Khó';
const letters = ['A','B','C','D'];
const scenario = {
  'Dễ': ['Which statement correctly describes {x} in modern Dart or Flutter?', 'A developer is learning {x}. Which recommendation is correct?', 'Which fundamental rule should be followed when using {x}?'],
  'Trung bình': ['During a code review involving {x}, which change is the best practice?', 'An application has a maintainability issue related to {x}. Which solution is most appropriate?', 'Which implementation decision best applies {x} in a production Flutter app?', 'A team is refactoring code that uses {x}. Which proposal should they accept?'],
  'Khó': ['A production app shows an intermittent defect involving {x}. Which remediation best addresses the root cause?', 'While optimizing a large Flutter codebase, which decision about {x} is technically sound?'],
};

let questions = [], number = 1;
for (const [category, count, url, concepts] of categories) {
  for (let i = 0; i < count; i++) {
    const c = concepts[i % concepts.length];
    const level = levelFor(i, count);
    const templates = scenario[level];
    const baseQuestion = templates[Math.floor(i / concepts.length) % templates.length].replace('{x}', c[0]);
    const question = `Within ${category}, ${baseQuestion[0].toLowerCase()}${baseQuestion.slice(1)}`;
    const rotation = (number * 3 + i) % 4;
    const raw = [
      { text: c[1], correct: true, why: `Đây là cách áp dụng đúng đối với ${c[0]}: ${c[1]}.` },
      { text: c[2], correct: false, why: `Phương án này sai vì ${c[2]} không bảo đảm đúng ngữ nghĩa hoặc vòng đời của ${c[0]}.` },
      { text: c[3], correct: false, why: `Phương án này sai vì ${c[3]} dễ gây lỗi kiểu dữ liệu, vòng đời, hiệu năng hoặc khả năng bảo trì.` },
      { text: c[4], correct: false, why: `Phương án này sai vì ${c[4]} đi ngược trách nhiệm và best practice của ${c[0]}.` },
    ];
    const options = raw.map((_, j) => raw[(j + rotation) % 4]);
    questions.push({ number, category, level, question, options, answer: letters[options.findIndex(o => o.correct)], url, concept: c[0] });
    number++;
  }
}

const counts = Object.fromEntries(categories.map(c => [c[0], questions.filter(q => q.category === c[0]).length]));
const levels = Object.fromEntries(['Dễ','Trung bình','Khó'].map(l => [l, questions.filter(q => q.level === l).length]));
if (questions.length !== 500 || levels['Dễ'] !== 150 || levels['Trung bình'] !== 250 || levels['Khó'] !== 100) throw new Error(`Invalid totals: ${questions.length} ${JSON.stringify(levels)}`);
if (questions.some(q => q.options.length !== 4 || q.options.filter(o => o.correct).length !== 1)) throw new Error('Invalid options');

let md = '# NGÂN HÀNG 500 CÂU HỎI TRẮC NGHIỆM FLUTTER\n\n';
md += `> Phân bố: 150 câu Dễ (30%), 250 câu Trung bình (50%), 100 câu Khó (20%). Nội dung được biên soạn theo tài liệu chính thức, cập nhật ngày 16/07/2026.\n\n`;
md += '## Bảng phân bố\n\n| Chủ đề | Số câu |\n|---|---:|\n' + categories.map(c => `| ${c[0]} | ${c[1]} |`).join('\n') + '\n| **Tổng cộng** | **500** |\n\n';
for (const q of questions) {
  md += `### Câu ${q.number}: ${q.category}\n\n**Độ khó:** ${q.level}\n\n**Question:** ${q.question}\n\n`;
  q.options.forEach((o,i) => md += `${letters[i]}. ${o.text[0].toUpperCase() + o.text.slice(1)}.\n\n`);
  md += `**Correct Answer:** ${q.answer}\n\n**Giải thích bằng tiếng Việt:**\n\n`;
  md += `Trọng tâm của câu hỏi là **${q.concept}**. ${q.options[letters.indexOf(q.answer)].why} `;
  q.options.forEach((o,i) => { if (!o.correct) md += `Đáp án ${letters[i]} sai: ${o.why} `; });
  md += `Vì vậy, ${q.answer} là đáp án duy nhất phù hợp.\n\n**Link tham khảo:**\n\n${q.url}\n\n---\n\n`;
}

const outMd = path.resolve('Flutter_500_Questions.md');
fs.writeFileSync(outMd, md, 'utf8');

const children = [
  new Paragraph({ heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'NGÂN HÀNG 500 CÂU HỎI TRẮC NGHIỆM FLUTTER', bold: true })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun('Dart & Flutter • Ôn tập và phỏng vấn Flutter Developer')] }),
  new Paragraph({ children: [new TextRun({ text: 'Phân bố độ khó: ', bold: true }), new TextRun('150 Dễ (30%) • 250 Trung bình (50%) • 100 Khó (20%)')] }),
  new Paragraph({ children: [new TextRun({ text: 'Phân bố chủ đề: ', bold: true }), new TextRun(categories.map(c => `${c[0]}: ${c[1]}`).join('; '))] }),
  new Paragraph({ children: [new PageBreak()] }),
];
for (const q of questions) {
  children.push(new Paragraph({ heading: HeadingLevel.HEADING_3, keepNext: true, children: [new TextRun(`Câu ${q.number}: ${q.category}`)] }));
  children.push(new Paragraph({ children: [new TextRun({ text: 'Độ khó: ', bold: true }), new TextRun(q.level)] }));
  children.push(new Paragraph({ keepNext: true, children: [new TextRun({ text: 'Question: ', bold: true }), new TextRun(q.question)] }));
  q.options.forEach((o,i) => children.push(new Paragraph({ indent: { left: 360 }, children: [new TextRun(`${letters[i]}. ${o.text[0].toUpperCase() + o.text.slice(1)}.`)] })));
  children.push(new Paragraph({ children: [new TextRun({ text: 'Correct Answer: ', bold: true }), new TextRun({ text: q.answer, bold: true })] }));
  children.push(new Paragraph({ keepNext: true, children: [new TextRun({ text: 'Giải thích bằng tiếng Việt:', bold: true })] }));
  let explanation = `Trọng tâm của câu hỏi là ${q.concept}. ${q.options[letters.indexOf(q.answer)].why} `;
  q.options.forEach((o,i) => { if (!o.correct) explanation += `Đáp án ${letters[i]} sai: ${o.why} `; });
  explanation += `Vì vậy, ${q.answer} là đáp án duy nhất phù hợp.`;
  children.push(new Paragraph({ children: [new TextRun(explanation)] }));
  children.push(new Paragraph({ children: [new TextRun({ text: 'Link tham khảo: ', bold: true }), new TextRun({ text: q.url, style: 'Hyperlink' })] }));
  children.push(new Paragraph(''));
}
const doc = new Document({ sections: [{ properties: {}, children }] });
Packer.toBuffer(doc).then(buffer => {
  const outDocx = path.resolve('Flutter_500_Questions.docx');
  fs.writeFileSync(outDocx, buffer);
  const report = { total: questions.length, categories: counts, difficulty: levels, markdownBytes: fs.statSync(outMd).size, docxBytes: buffer.length };
  fs.writeFileSync(path.resolve('Flutter_500_Questions.audit.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
});

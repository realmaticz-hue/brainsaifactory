// Common Errors Database for Git Repair Brain
// This module provides error detection and fix suggestions based on a comprehensive error database

interface CommonError {
  id: number;
  category: string;
  error: string;
  description: string;
  suggestedFix: string;
}

// Import the common errors database
const COMMON_ERRORS: CommonError[] = [
  {"id":1,"category":"Frontend/UI","error":"Hydration mismatch","description":"React/Next.js DOM mismatch between server and client","suggestedFix":"Check SSR vs client render, ensure markup matches"},
  {"id":2,"category":"Frontend/UI","error":"Stale closure in useEffect","description":"Effect captures outdated variables","suggestedFix":"Add necessary dependencies to useEffect array"},
  {"id":3,"category":"Frontend/UI","error":"Undefined props or state access","description":"Accessing props/state before initialization","suggestedFix":"Add null/undefined checks or default values"},
  {"id":4,"category":"Frontend/UI","error":"DOM node not found","description":"document.getElementById or querySelector returns null","suggestedFix":"Ensure element exists before access or use refs"},
  {"id":5,"category":"Frontend/UI","error":"Event listener not attached","description":"Event handlers are not firing","suggestedFix":"Verify selector and timing of listener attachment"},
  {"id":6,"category":"Frontend/UI","error":"TypeError: Cannot read property 'x' of undefined","description":"Accessing property of undefined object","suggestedFix":"Check object exists before property access"},
  {"id":7,"category":"Frontend/UI","error":"TypeError: x is not a function","description":"Calling a non-function value as function","suggestedFix":"Check variable type and ensure function is defined"},
  {"id":8,"category":"Frontend/UI","error":"CSS specificity conflicts","description":"Styles not applied due to cascade","suggestedFix":"Increase specificity or use scoped styles"},
  {"id":9,"category":"Frontend/UI","error":"Overflow/layout break in responsive design","description":"Layout misalignment on certain screens","suggestedFix":"Use responsive units, flex/grid layout, media queries"},
  {"id":10,"category":"Frontend/UI","error":"Browser-specific rendering differences","description":"App appears differently across browsers","suggestedFix":"Use cross-browser compatible CSS/JS or polyfills"},
  {"id":11,"category":"Frontend/UI","error":"Animation/transition not firing","description":"CSS or JS animation does not start","suggestedFix":"Check triggers, classes, or animation events"},
  {"id":12,"category":"Frontend/UI","error":"Image or asset not found (404)","description":"Requested resource missing","suggestedFix":"Verify path or deployment asset"},
  {"id":13,"category":"Frontend/UI","error":"React key missing or duplicate in list","description":"List rendering may behave incorrectly","suggestedFix":"Add unique keys for list items"},
  {"id":14,"category":"Frontend/UI","error":"Memory leak in component","description":"Component subscriptions or timers not cleared","suggestedFix":"Cleanup in useEffect return or componentWillUnmount"},
  {"id":15,"category":"Frontend/UI","error":"Infinite re-render in React","description":"Component continuously re-renders","suggestedFix":"Check state updates and useEffect dependencies"},
  {"id":16,"category":"Frontend/UI","error":"Touch/gesture handling errors","description":"Mobile gestures not recognized","suggestedFix":"Verify touch events and gesture libraries"},
  {"id":17,"category":"Frontend/UI","error":"Navigation/routing failures","description":"React-router or Next.js route not working","suggestedFix":"Check route definitions and navigation logic"},
  {"id":18,"category":"Frontend/UI","error":"Client-side storage unavailable","description":"localStorage/sessionStorage inaccessible","suggestedFix":"Check browser support and permissions"},
  {"id":19,"category":"Frontend/UI","error":"Invalid CSS property/unsupported browser style","description":"Property not recognized by browser","suggestedFix":"Use supported properties or prefixes"},
  {"id":20,"category":"Backend/Server","error":"ReferenceError: x is not defined","description":"Variable/function not in scope","suggestedFix":"Declare variable or import module correctly"},
  {"id":21,"category":"Backend/Server","error":"TypeError: x is not a function","description":"Calling a non-function value","suggestedFix":"Ensure variable is function type"},
  {"id":22,"category":"Backend/Server","error":"Uncaught Promise rejection","description":"Promise error not handled","suggestedFix":"Add .catch() or try/catch in async/await"},
  {"id":23,"category":"Backend/Server","error":"Stack overflow","description":"Infinite recursion or deep call stack","suggestedFix":"Check recursion base case, refactor loops"},
  {"id":24,"category":"Backend/Server","error":"Out of memory","description":"Server memory exceeded","suggestedFix":"Optimize memory usage or increase resources"},
  {"id":25,"category":"Backend/Server","error":"API endpoint not found (404)","description":"Route does not exist","suggestedFix":"Verify route paths"},
  {"id":26,"category":"Backend/Server","error":"Method not allowed (405)","description":"HTTP method not allowed for endpoint","suggestedFix":"Check allowed HTTP methods"},
  {"id":27,"category":"Backend/Server","error":"Authentication failed (401)","description":"User credentials invalid","suggestedFix":"Verify auth logic and tokens"},
  {"id":28,"category":"Backend/Server","error":"Authorization failed (403)","description":"User not permitted to access resource","suggestedFix":"Check roles and permissions"},
  {"id":29,"category":"Backend/Server","error":"Rate limiting exceeded (429)","description":"Too many requests","suggestedFix":"Implement retry/backoff logic"},
  {"id":30,"category":"Backend/Server","error":"Unexpected token in JSON parse","description":"Malformed JSON received","suggestedFix":"Validate JSON format"},
  {"id":31,"category":"Backend/Server","error":"Missing headers (CORS preflight)","description":"Request blocked by browser","suggestedFix":"Set correct CORS headers"},
  {"id":32,"category":"Backend/Server","error":"ECONNREFUSED","description":"Server connection refused","suggestedFix":"Check server running and network access"},
  {"id":33,"category":"Backend/Server","error":"EADDRINUSE","description":"Port already in use","suggestedFix":"Change port or kill conflicting process"},
  {"id":34,"category":"Backend/Server","error":"ECONNRESET","description":"Connection reset by peer","suggestedFix":"Retry request or check server stability"},
  {"id":35,"category":"Backend/Server","error":"ETIMEDOUT","description":"Network timeout","suggestedFix":"Check network or increase timeout"},
  {"id":36,"category":"Backend/Server","error":"Session expired / token invalid","description":"User session not valid","suggestedFix":"Re-authenticate user"},
  {"id":37,"category":"Database/Storage","error":"SQL syntax error","description":"Malformed query","suggestedFix":"Check query syntax"},
  {"id":38,"category":"Database/Storage","error":"Table not found","description":"Database table missing","suggestedFix":"Verify table exists or migrate DB"},
  {"id":39,"category":"Database/Storage","error":"Column not found","description":"Column missing in table","suggestedFix":"Verify DB schema"},
  {"id":40,"category":"Database/Storage","error":"Constraint violation","description":"Unique or foreign key constraint failed","suggestedFix":"Check data integrity"},
  {"id":41,"category":"Database/Storage","error":"Deadlock detected","description":"Concurrent transactions blocking each other","suggestedFix":"Retry transaction or adjust isolation level"},
  {"id":42,"category":"Database/Storage","error":"Transaction aborted","description":"Transaction failed","suggestedFix":"Rollback and retry"},
  {"id":43,"category":"Database/Storage","error":"Connection refused","description":"DB connection not accepted","suggestedFix":"Check DB service and credentials"},
  {"id":44,"category":"Database/Storage","error":"Data type mismatch","description":"Query value type invalid","suggestedFix":"Cast or correct types"},
  {"id":45,"category":"Database/Storage","error":"Duplicate key error","description":"Unique key already exists","suggestedFix":"Check data before insert"},
  {"id":46,"category":"Network/API","error":"Host unreachable (ENOTFOUND)","description":"DNS or network unreachable","suggestedFix":"Check host and network"},
  {"id":47,"category":"Network/API","error":"DNS lookup failed","description":"Cannot resolve host","suggestedFix":"Verify DNS settings"},
  {"id":48,"category":"Network/API","error":"SSL/TLS handshake failed","description":"Secure connection failed","suggestedFix":"Check certificates"},
  {"id":49,"category":"Network/API","error":"HTTP 400 Bad Request","description":"Malformed client request","suggestedFix":"Validate request payload"},
  {"id":50,"category":"Network/API","error":"HTTP 500 Internal Server Error","description":"Server failed to handle request","suggestedFix":"Check server logs"},
  {"id":51,"category":"Network/API","error":"CORS policy violation","description":"Cross-origin request blocked","suggestedFix":"Configure server CORS headers"},
  {"id":52,"category":"Security/Compliance","error":"SQL injection detected","description":"Unvalidated input allows malicious query","suggestedFix":"Use parameterized queries/ORM"},
  {"id":53,"category":"Security/Compliance","error":"Cross-Site Scripting (XSS)","description":"Malicious script injected into page","suggestedFix":"Sanitize input and output"},
  {"id":54,"category":"Security/Compliance","error":"Cross-Site Request Forgery (CSRF)","description":"Unauthorized request executed","suggestedFix":"Use CSRF tokens"},
  {"id":55,"category":"Security/Compliance","error":"Broken access control","description":"User accesses unauthorized resources","suggestedFix":"Implement role-based access control"},
  {"id":56,"category":"DevOps/Environment","error":"Node version mismatch","description":"Installed Node.js version incompatible","suggestedFix":"Install correct Node version"},
  {"id":57,"category":"DevOps/Environment","error":"Build script failure","description":"Build process failed","suggestedFix":"Check logs, scripts, dependencies"},
  {"id":58,"category":"Performance/Scalability","error":"Event loop blocked","description":"Heavy sync code blocks Node.js","suggestedFix":"Use async operations or worker threads"},
  {"id":59,"category":"Language/Toolchain","error":"TS2307 Cannot find module","description":"TypeScript module import not found","suggestedFix":"Check path or install package"},
  {"id":60,"category":"Language/Toolchain","error":"TS2345 Argument of type X not assignable","description":"Type mismatch in TypeScript","suggestedFix":"Adjust type annotations or cast"},
  {"id":61,"category":"Language/Toolchain","error":"React invalid hook call warning","description":"Hooks used incorrectly","suggestedFix":"Use hooks only inside functional components"},
  {"id":62,"category":"Language/Toolchain","error":"Python ImportError","description":"Module not found","suggestedFix":"Install module or check path"},
  {"id":63,"category":"Language/Toolchain","error":"Python NameError","description":"Variable not defined","suggestedFix":"Declare variable before use"},
  {"id":64,"category":"Language/Toolchain","error":"Java NullPointerException","description":"Object reference is null","suggestedFix":"Check object initialization"},
  {"id":65,"category":"Language/Toolchain","error":"Java ClassNotFoundException","description":"Class not found at runtime","suggestedFix":"Check classpath or dependencies"},
  {"id":66,"category":"Language/Toolchain","error":"C++ Segmentation fault (SIGSEGV)","description":"Illegal memory access","suggestedFix":"Check pointer validity"},
  {"id":67,"category":"Frontend/UI","error":"Accessibility violations","description":"Screen reader issues or missing ARIA roles","suggestedFix":"Add ARIA roles and semantic HTML"},
  {"id":68,"category":"Frontend/UI","error":"Shadow DOM/web component errors","description":"Custom element not rendered correctly","suggestedFix":"Check lifecycle hooks and encapsulation"},
  {"id":69,"category":"Backend/Server","error":"Infinite loop/CPU lock","description":"CPU busy due to loop","suggestedFix":"Optimize loop or add exit condition"},
  {"id":70,"category":"Database/Storage","error":"Missing index for query","description":"Slow query due to missing index","suggestedFix":"Add appropriate DB index"},
  {"id":71,"category":"Database/Storage","error":"Referential integrity violation","description":"Foreign key constraint failed","suggestedFix":"Ensure referenced record exists"},
  {"id":72,"category":"Network/API","error":"Invalid response format","description":"Server returned unexpected format","suggestedFix":"Validate server response"},
  {"id":73,"category":"Network/API","error":"Socket connection reset","description":"Connection reset by peer","suggestedFix":"Retry or check server stability"},
  {"id":74,"category":"Security/Compliance","error":"Weak password detected","description":"Password does not meet complexity","suggestedFix":"Enforce strong password policy"},
  {"id":75,"category":"Security/Compliance","error":"Plaintext storage of secrets","description":"Secrets stored unencrypted","suggestedFix":"Encrypt secrets at rest"},
  {"id":76,"category":"DevOps/Environment","error":"Missing system dependencies","description":"Required tools/libraries not installed","suggestedFix":"Install missing dependencies"},
  {"id":77,"category":"DevOps/Environment","error":"Docker build failure","description":"Container image failed to build","suggestedFix":"Check Dockerfile syntax and context"},
  {"id":78,"category":"DevOps/Environment","error":"Kubernetes pod crash","description":"Pod terminated unexpectedly","suggestedFix":"Check logs, resources, and liveness probes"},
  {"id":79,"category":"Performance/Scalability","error":"High memory usage","description":"App consumes excessive memory","suggestedFix":"Optimize memory allocation and leaks"},
  {"id":80,"category":"Performance/Scalability","error":"High latency under load","description":"Slow responses when under traffic","suggestedFix":"Scale infrastructure or optimize code"},
  {"id":81,"category":"Performance/Scalability","error":"Thread pool exhaustion","description":"All threads busy","suggestedFix":"Increase pool size or optimize tasks"},
  {"id":82,"category":"Database/Storage","error":"Serialization/parsing failure","description":"Unable to parse data format","suggestedFix":"Validate JSON/XML or data schema"},
  {"id":83,"category":"Frontend/UI","error":"Client-side storage full","description":"localStorage quota exceeded","suggestedFix":"Clear storage or handle exceptions"},
  {"id":84,"category":"Network/API","error":"Rate limiting exceeded","description":"Too many requests to server","suggestedFix":"Implement retry/backoff"},
  {"id":85,"category":"Backend/Server","error":"Missing environment variables","description":"Required env vars not set","suggestedFix":"Add variables in .env or environment"},
  {"id":86,"category":"Security/Compliance","error":"Open redirect vulnerability","description":"Redirect to untrusted URL","suggestedFix":"Validate redirect URLs"},
  {"id":87,"category":"Security/Compliance","error":"File upload without validation","description":"Unrestricted file uploads","suggestedFix":"Validate file type/size"},
  {"id":88,"category":"DevOps/Environment","error":"Configuration file missing/malformed","description":"App config not found or invalid","suggestedFix":"Check file presence and format"},
  {"id":89,"category":"Language/Toolchain","error":"Flutter widget build error","description":"Flutter widget tree fails","suggestedFix":"Check build method and widget hierarchy"},
  {"id":90,"category":"Language/Toolchain","error":"Swift optional unwrapping nil","description":"Nil value unwrapped","suggestedFix":"Use optional binding or guard"},
  {"id":91,"category":"Backend/Server","error":"JSON parse error from API","description":"Server response invalid JSON","suggestedFix":"Validate response or fix server"},
  {"id":92,"category":"Frontend/UI","error":"List virtualization error","description":"Large list rendering fails","suggestedFix":"Use virtualized list components"},
  {"id":93,"category":"Database/Storage","error":"Connection pool exhausted","description":"All DB connections in use","suggestedFix":"Increase pool or optimize queries"},
  {"id":94,"category":"Network/API","error":"HTTP 503 Service Unavailable","description":"Server temporarily unavailable","suggestedFix":"Retry or check server load"},
  {"id":95,"category":"DevOps/Environment","error":"Deployment rollback failed","description":"Failed to revert deployment","suggestedFix":"Investigate deployment scripts and logs"},
  {"id":96,"category":"Performance/Scalability","error":"Cache miss/misconfiguration","description":"Cache not serving correct data","suggestedFix":"Validate cache keys and configuration"},
  {"id":97,"category":"Performance/Scalability","error":"CDN content not updated/stale","description":"Users receive outdated content","suggestedFix":"Invalidate CDN cache or refresh content"},
  {"id":98,"category":"Backend/Server","error":"Invalid request parameters","description":"API called with wrong parameters","suggestedFix":"Validate and sanitize inputs"},
  {"id":99,"category":"Frontend/UI","error":"Component failed to mount","description":"React/Vue component throws error on mount","suggestedFix":"Check props, state, lifecycle hooks"},
  {"id":100,"category":"Security/Compliance","error":"Insufficient logging/monitoring","description":"Security events not recorded","suggestedFix":"Implement centralized logging and alerts"},
  {"id":101,"category":"Language/Toolchain","error":"Android Gradle sync failed","description":"Gradle project sync error","suggestedFix":"Check build.gradle and SDK versions"},
  {"id":102,"category":"Language/Toolchain","error":"iOS Xcode signing/provisioning error","description":"App cannot be signed","suggestedFix":"Check certificates and provisioning profiles"},
  {"id":103,"category":"Backend/Server","error":"Async function error unhandled","description":"Async exception not caught","suggestedFix":"Wrap in try/catch or use .catch()"},
  {"id":104,"category":"Database/Storage","error":"Lock wait timeout","description":"Waiting for DB lock exceeds timeout","suggestedFix":"Reduce transaction duration or retry"},
  {"id":105,"category":"Backend/Server","error":"Session store unavailable","description":"Cannot access session backend","suggestedFix":"Check session service configuration"},
  {"id":106,"category":"Frontend/UI","error":"Form validation failure","description":"Form input invalid","suggestedFix":"Implement validation rules and error messages"},
  {"id":107,"category":"Network/API","error":"Malformed request body","description":"Request cannot be parsed by server","suggestedFix":"Validate request format"},
  {"id":108,"category":"Network/API","error":"Token replay attack detected","description":"Reuse of authentication token","suggestedFix":"Implement token expiration and nonce checks"},
  {"id":109,"category":"Backend/Server","error":"Unreachable code detected","description":"Code never executes","suggestedFix":"Refactor or remove unreachable sections"},
  {"id":110,"category":"Frontend/UI","error":"Invalid component prop type","description":"Passed prop type mismatches expected","suggestedFix":"Fix prop type definitions or values"},
  {"id":111,"category":"Database/Storage","error":"Data corruption detected","description":"Database contains invalid data","suggestedFix":"Run integrity checks and restore backups"},
  {"id":112,"category":"DevOps/Environment","error":"Port binding conflict","description":"Port already in use by another process","suggestedFix":"Change port or terminate conflicting process"},
  {"id":113,"category":"Performance/Scalability","error":"Disk I/O bottleneck","description":"Disk operations slow","suggestedFix":"Optimize reads/writes, use SSD or caching"},
  {"id":114,"category":"Performance/Scalability","error":"Network saturation","description":"Bandwidth exceeded","suggestedFix":"Optimize network usage or increase bandwidth"},
  {"id":115,"category":"Backend/Server","error":"Missing required environment variables","description":"Critical config variables absent","suggestedFix":"Add variables in environment or .env file"},
  {"id":116,"category":"Database/Storage","error":"Referential integrity violation","description":"Foreign key constraint failed","suggestedFix":"Ensure referenced data exists"},
  {"id":117,"category":"Frontend/UI","error":"Unhandled promise in UI code","description":"Async operation error not caught","suggestedFix":"Use try/catch or .catch() in UI code"},
  {"id":118,"category":"Backend/Server","error":"Unhandled exception","description":"Server crashed due to unhandled error","suggestedFix":"Add global error handling and logging"},
  {"id":119,"category":"DevOps/Environment","error":"CI/CD pipeline failure","description":"Automated build/test/deploy failed","suggestedFix":"Check pipeline logs and fix scripts"},
  {"id":120,"category":"Security/Compliance","error":"Insecure CORS headers","description":"CORS policy too permissive","suggestedFix":"Restrict allowed origins"},
  {"id":121,"category":"Frontend/UI","error":"Image asset failed to load","description":"Broken image reference","suggestedFix":"Verify path or hosting"},
  {"id":122,"category":"Backend/Server","error":"Timeout waiting for resource","description":"Server waits too long for dependent service","suggestedFix":"Increase timeout or optimize service"},
  {"id":123,"category":"Database/Storage","error":"Migration failed","description":"Database schema migration error","suggestedFix":"Check migration scripts and rollback"},
  {"id":124,"category":"Network/API","error":"HTTP 504 Gateway Timeout","description":"Upstream server did not respond in time","suggestedFix":"Check upstream service and timeouts"},
  {"id":125,"category":"DevOps/Environment","error":"File permission denied","description":"Cannot read/write file","suggestedFix":"Adjust file permissions or ownership"},
  {"id":126,"category":"Performance/Scalability","error":"Queue backlog","description":"Message queue backlog growing","suggestedFix":"Increase consumers or optimize processing"},
  {"id":127,"category":"Frontend/UI","error":"Incorrect z-index / stacking context","description":"UI layers overlapping incorrectly","suggestedFix":"Fix CSS z-index values"},
  {"id":128,"category":"Backend/Server","error":"Dependency version mismatch","description":"Package version incompatible","suggestedFix":"Align dependency versions or upgrade"},
  {"id":129,"category":"Security/Compliance","error":"Improper encryption / key management","description":"Weak or mismanaged encryption keys","suggestedFix":"Use proper encryption and secure key storage"},
  {"id":130,"category":"DevOps/Environment","error":"Outdated Docker image","description":"Image uses deprecated dependencies","suggestedFix":"Update base image and rebuild"},
  {"id":131,"category":"Language/Toolchain","error":"Python TypeError","description":"Incorrect type operation","suggestedFix":"Check variable types and casts"},
  {"id":132,"category":"Language/Toolchain","error":"Java IndexOutOfBoundsException","description":"Accessed list/array out of bounds","suggestedFix":"Check index and collection size"},
  {"id":133,"category":"Frontend/UI","error":"Unhandled promise rejection in event handler","description":"Async error in UI event","suggestedFix":"Use try/catch or .catch()"},
  {"id":134,"category":"Backend/Server","error":"Circular dependency detected","description":"Modules depend on each other creating cycle","suggestedFix":"Refactor imports or dependency graph"},
  {"id":135,"category":"Network/API","error":"Malformed headers","description":"Invalid HTTP headers","suggestedFix":"Correct header formatting"},
  {"id":136,"category":"Database/Storage","error":"Index corruption","description":"Database index invalid","suggestedFix":"Rebuild indexes"},
  {"id":137,"category":"Frontend/UI","error":"Invalid form submission","description":"Form fails validation","suggestedFix":"Implement frontend validation"},
  {"id":138,"category":"Security/Compliance","error":"Insufficient session expiration","description":"Sessions last too long","suggestedFix":"Enforce session timeout"},
  {"id":139,"category":"Performance/Scalability","error":"Thread starvation","description":"Threads unable to run","suggestedFix":"Increase threads or optimize tasks"},
  {"id":140,"category":"Backend/Server","error":"Resource leak","description":"Handles/sockets not released","suggestedFix":"Close resources after use"},
  {"id":141,"category":"Database/Storage","error":"Blob storage failure","description":"Failed to read/write blob","suggestedFix":"Check storage access and permissions"},
  {"id":142,"category":"Frontend/UI","error":"Script execution blocked","description":"Browser blocks JS execution","suggestedFix":"Check CSP and browser policies"},
  {"id":143,"category":"DevOps/Environment","error":"SSL certificate expired","description":"HTTPS certificate expired","suggestedFix":"Renew certificate"},
  {"id":144,"category":"Performance/Scalability","error":"High garbage collection pause","description":"Long GC causes slowdowns","suggestedFix":"Optimize memory allocation"},
  {"id":145,"category":"Backend/Server","error":"Unhandled promise rejection in server","description":"Async error crashes server","suggestedFix":"Add global promise rejection handler"},
  {"id":146,"category":"Frontend/UI","error":"Incorrect event bubbling","description":"Event triggers incorrectly","suggestedFix":"Use stopPropagation or correct listener"},
  {"id":147,"category":"Network/API","error":"Connection reset by peer","description":"Server resets connection","suggestedFix":"Retry or check server health"},
  {"id":148,"category":"Database/Storage","error":"Database timeout","description":"Query execution exceeded time","suggestedFix":"Optimize query or increase timeout"},
  {"id":149,"category":"Security/Compliance","error":"Token replay vulnerability","description":"Token reused maliciously","suggestedFix":"Implement nonce or expiration"},
  {"id":150,"category":"DevOps/Environment","error":"Configuration drift detected","description":"Deployed config differs from repo","suggestedFix":"Sync configuration with version control"}
];

/**
 * Search for matching errors in the common errors database
 * Uses fuzzy matching to find similar errors
 */
export function findMatchingErrors(errorMessage: string, maxResults = 5): CommonError[] {
  const lowerMessage = errorMessage.toLowerCase();
  const matches: Array<{ error: CommonError; score: number }> = [];

  for (const error of COMMON_ERRORS) {
    let score = 0;
    
    // Exact match in error name (highest priority)
    if (lowerMessage.includes(error.error.toLowerCase())) {
      score += 100;
    }
    
    // Match in description
    if (lowerMessage.includes(error.description.toLowerCase()) || 
        error.description.toLowerCase().includes(lowerMessage)) {
      score += 50;
    }
    
    // Check for common error keywords
    const errorWords = error.error.toLowerCase().split(/\s+/);
    const messageWords = lowerMessage.split(/\s+/);
    
    for (const word of errorWords) {
      if (word.length > 3 && messageWords.some(mw => mw.includes(word) || word.includes(mw))) {
        score += 10;
      }
    }
    
    if (score > 0) {
      matches.push({ error, score });
    }
  }

  return matches
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map(m => m.error);
}

/**
 * Get errors by category
 */
export function getErrorsByCategory(category: string): CommonError[] {
  return COMMON_ERRORS.filter(e => e.category === category);
}

/**
 * Get all unique categories
 */
export function getAllCategories(): string[] {
  return [...new Set(COMMON_ERRORS.map(e => e.category))];
}

/**
 * Get error by ID
 */
export function getErrorById(id: number): CommonError | undefined {
  return COMMON_ERRORS.find(e => e.id === id);
}

/**
 * Generate enhanced error context with suggestions from the database
 */
export function enhanceErrorWithSuggestions(errorMessage: string, file?: string, line?: number): {
  originalError: string;
  matches: CommonError[];
  enhancedSuggestion: string;
  category: string | null;
} {
  const matches = findMatchingErrors(errorMessage, 3);
  
  let enhancedSuggestion = '';
  let category: string | null = null;
  
  if (matches.length > 0) {
    category = matches[0].category;
    enhancedSuggestion = `Based on common error patterns, here are suggested fixes:\n\n`;
    
    matches.forEach((match, idx) => {
      enhancedSuggestion += `${idx + 1}. ${match.error}\n`;
      enhancedSuggestion += `   Description: ${match.description}\n`;
      enhancedSuggestion += `   Fix: ${match.suggestedFix}\n\n`;
    });
    
    if (file && line) {
      enhancedSuggestion += `\nApply these fixes to ${file}:${line}`;
    }
  } else {
    enhancedSuggestion = 'No exact matches found in common errors database. Using AI-powered analysis.';
  }
  
  return {
    originalError: errorMessage,
    matches,
    enhancedSuggestion,
    category,
  };
}

/**
 * Get statistics about the error database
 */
export function getErrorDatabaseStats() {
  const categories = getAllCategories();
  const stats: Record<string, number> = {};
  
  for (const category of categories) {
    stats[category] = getErrorsByCategory(category).length;
  }
  
  return {
    totalErrors: COMMON_ERRORS.length,
    categories: categories.length,
    breakdown: stats,
  };
}

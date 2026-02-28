
# TestSprite AI Testing Report(MCP)

---

## 1️⃣ Document Metadata
- **Project Name:** mockqqi4
- **Date:** 2025-12-24
- **Prepared by:** TestSprite AI Team

---

## 2️⃣ Requirement Validation Summary

#### Test TC001
- **Test Name:** User Registration and Authentication
- **Test Code:** [TC001_User_Registration_and_Authentication.py](./TC001_User_Registration_and_Authentication.py)
- **Test Error:** Stopped testing due to inability to access the registration form. The signup form does not appear after clicking 'Sign Up' or navigating to the signup URL. Please fix this issue to proceed with registration and authentication tests.
Browser Console Logs:
[ERROR] Failed to load resource: net::ERR_EMPTY_RESPONSE (at https://unpkg.com/@splinetool/runtime@1.10.90/build/runtime.js:0:0)
[ERROR] Failed to load resource: net::ERR_EMPTY_RESPONSE (at https://app.spline.design/_assets/_icons/icon_favicon32x32.png:0:0)
[WARNING] Detected `scroll-behavior: smooth` on the `<html>` element. To disable smooth scrolling during route transitions, add `data-scroll-behavior="smooth"` to your <html> element. Learn more: https://nextjs.org/docs/messages/missing-data-scroll-behavior (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_7a8122d0._.js:2287:27)
[ERROR] [v0] AuthPage - useEffect: Client ready, session status: no_session (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_7a8122d0._.js:3117:31)
[ERROR] [v0] AuthPage - useEffect: Client ready, session status: no_session (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_7a8122d0._.js:3117:31)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/369d8679-8d09-4aa3-8d6f-fc06d9b2a645/ef114bf4-ca9c-4a6d-b19f-c97ea8c0b76c
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC002
- **Test Name:** Audio/Video Interview Functionality
- **Test Code:** [TC002_AudioVideo_Interview_Functionality.py](./TC002_AudioVideo_Interview_Functionality.py)
- **Test Error:** Testing stopped due to critical website loading error preventing continuation of the audio/video interview workflow. The error page appeared after navigation attempts, blocking further progress.
Browser Console Logs:
[ERROR] Failed to load resource: net::ERR_EMPTY_RESPONSE (at https://app.spline.design/_assets/_icons/icon_favicon32x32.png:0:0)
[WARNING] [GroupMarkerNotSet(crbug.com/242999)!:A06C3B004C130000]Automatic fallback to software WebGL has been deprecated. Please use the --enable-unsafe-swiftshader flag to opt in to lower security guarantees for trusted content. (at https://my.spline.design/interactiveaiwebsite-j7qGbx3fJXOPFA20l5QVcZaz/:0:0)
[WARNING] [.WebGL-0x134c06024d00]GL Driver Message (OpenGL, Performance, GL_CLOSE_PATH_NV, High): GPU stall due to ReadPixels (at https://my.spline.design/interactiveaiwebsite-j7qGbx3fJXOPFA20l5QVcZaz/:0:0)
[WARNING] [.WebGL-0x134c06024d00]GL Driver Message (OpenGL, Performance, GL_CLOSE_PATH_NV, High): GPU stall due to ReadPixels (at https://my.spline.design/interactiveaiwebsite-j7qGbx3fJXOPFA20l5QVcZaz/:0:0)
[WARNING] [.WebGL-0x134c06024d00]GL Driver Message (OpenGL, Performance, GL_CLOSE_PATH_NV, High): GPU stall due to ReadPixels (at https://my.spline.design/interactiveaiwebsite-j7qGbx3fJXOPFA20l5QVcZaz/:0:0)
[WARNING] [.WebGL-0x134c06024d00]GL Driver Message (OpenGL, Performance, GL_CLOSE_PATH_NV, High): GPU stall due to ReadPixels (this message will no longer repeat) (at https://my.spline.design/interactiveaiwebsite-j7qGbx3fJXOPFA20l5QVcZaz/:0:0)
[WARNING] Detected `scroll-behavior: smooth` on the `<html>` element. To disable smooth scrolling during route transitions, add `data-scroll-behavior="smooth"` to your <html> element. Learn more: https://nextjs.org/docs/messages/missing-data-scroll-behavior (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_7a8122d0._.js:2287:27)
[ERROR] [v0] AuthPage - useEffect: Client ready, session status: no_session (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_7a8122d0._.js:3117:31)
[ERROR] [v0] AuthPage - useEffect: Client ready, session status: no_session (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_7a8122d0._.js:3117:31)
[ERROR] [v0] Attempting to sign in with email: gaganbhuvan2027@gmail.com (Login flow) (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_7a8122d0._.js:3117:31)
[ERROR] [v0] Sign in response - Error: undefined Data: {user: Object, session: Object} (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_7a8122d0._.js:3117:31)
[WARNING] Detected `scroll-behavior: smooth` on the `<html>` element. To disable smooth scrolling during route transitions, add `data-scroll-behavior="smooth"` to your <html> element. Learn more: https://nextjs.org/docs/messages/missing-data-scroll-behavior (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_7a8122d0._.js:2287:27)
[ERROR] Failed to load resource: net::ERR_EMPTY_RESPONSE (at http://localhost:3000/api/user/credits:0:0)
[ERROR] CreditsDisplay - Error fetching credits: TypeError: Failed to fetch
    at fetchCredits (http://localhost:3000/_next/static/chunks/_b0c47495._.js:1385:31)
    at CreditsDisplay.useEffect (http://localhost:3000/_next/static/chunks/_b0c47495._.js:1373:13)
    at Object.react_stack_bottom_frame (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:14866:22)
    at runWithFiberInDEV (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:959:74)
    at commitHookEffectListMount (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:7260:167)
    at commitHookPassiveMountEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:7295:60)
    at commitPassiveMountOnFiber (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8690:33)
    at recursivelyTraversePassiveMountEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8677:316)
    at commitPassiveMountOnFiber (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8751:17)
    at recursivelyTraversePassiveMountEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8677:316)
    at commitPassiveMountOnFiber (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8751:17)
    at recursivelyTraversePassiveMountEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8677:316)
    at commitPassiveMountOnFiber (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8751:17)
    at recursivelyTraversePassiveMountEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8677:316)
    at commitPassiveMountOnFiber (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8689:17)
    at recursivelyTraversePassiveMountEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8677:316)
    at commitPassiveMountOnFiber (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8751:17)
    at recursivelyTraversePassiveMountEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8677:316)
    at commitPassiveMountOnFiber (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8689:17)
    at recursivelyTraversePassiveMountEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8677:316)
    at commitPassiveMountOnFiber (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8689:17)
    at recursivelyTraversePassiveMountEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8677:316)
    at commitPassiveMountOnFiber (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8689:17)
    at recursivelyTraversePassiveMountEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8677:316)
    at commitPassiveMountOnFiber (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8751:17)
    at recursivelyTraversePassiveMountEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8677:316)
    at commitPassiveMountOnFiber (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8751:17)
    at recursivelyTraversePassiveMountEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8677:316)
    at commitPassiveMountOnFiber (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8689:17)
    at recursivelyTraversePassiveMountEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8677:316)
    at commitPassiveMountOnFiber (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8694:17)
    at recursivelyTraversePassiveMountEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8677:316)
    at commitPassiveMountOnFiber (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8689:17)
    at recursivelyTraversePassiveMountEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8677:316)
    at commitPassiveMountOnFiber (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8689:17)
    at recursivelyTraversePassiveMountEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8677:316)
    at commitPassiveMountOnFiber (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8689:17)
    at recursivelyTraversePassiveMountEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8677:316)
    at commitPassiveMountOnFiber (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8689:17)
    at recursivelyTraversePassiveMountEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8677:316)
    at commitPassiveMountOnFiber (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8694:17)
    at recursivelyTraversePassiveMountEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8677:316)
    at commitPassiveMountOnFiber (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8689:17)
    at recursivelyTraversePassiveMountEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8677:316)
    at commitPassiveMountOnFiber (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8689:17)
    at recursivelyTraversePassiveMountEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8677:316)
    at commitPassiveMountOnFiber (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8751:17)
    at recursivelyTraversePassiveMountEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8677:316)
    at commitPassiveMountOnFiber (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8751:17)
    at recursivelyTraversePassiveMountEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8677:316) (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_7a8122d0._.js:3117:31)
[ERROR] Failed to load resource: net::ERR_EMPTY_RESPONSE (at http://localhost:3000/api/user/scheduled-interviews:0:0)
[ERROR] Error fetching scheduled interviews: TypeError: Failed to fetch
    at fetchScheduledInterviews (http://localhost:3000/_next/static/chunks/_b0c47495._.js:587:36)
    at NotificationsDropdown.useEffect (http://localhost:3000/_next/static/chunks/_b0c47495._.js:577:13)
    at Object.react_stack_bottom_frame (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:14866:22)
    at runWithFiberInDEV (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:959:74)
    at commitHookEffectListMount (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:7260:167)
    at commitHookPassiveMountEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:7295:60)
    at commitPassiveMountOnFiber (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8690:33)
    at recursivelyTraversePassiveMountEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8677:316)
    at commitPassiveMountOnFiber (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8751:17)
    at recursivelyTraversePassiveMountEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8677:316)
    at commitPassiveMountOnFiber (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8751:17)
    at recursivelyTraversePassiveMountEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8677:316)
    at commitPassiveMountOnFiber (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8751:17)
    at recursivelyTraversePassiveMountEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8677:316)
    at commitPassiveMountOnFiber (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8689:17)
    at recursivelyTraversePassiveMountEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8677:316)
    at commitPassiveMountOnFiber (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8751:17)
    at recursivelyTraversePassiveMountEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8677:316)
    at commitPassiveMountOnFiber (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8689:17)
    at recursivelyTraversePassiveMountEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8677:316)
    at commitPassiveMountOnFiber (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8689:17)
    at recursivelyTraversePassiveMountEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8677:316)
    at commitPassiveMountOnFiber (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8689:17)
    at recursivelyTraversePassiveMountEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8677:316)
    at commitPassiveMountOnFiber (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8751:17)
    at recursivelyTraversePassiveMountEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8677:316)
    at commitPassiveMountOnFiber (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8751:17)
    at recursivelyTraversePassiveMountEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8677:316)
    at commitPassiveMountOnFiber (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8689:17)
    at recursivelyTraversePassiveMountEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8677:316)
    at commitPassiveMountOnFiber (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8694:17)
    at recursivelyTraversePassiveMountEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8677:316)
    at commitPassiveMountOnFiber (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8689:17)
    at recursivelyTraversePassiveMountEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8677:316)
    at commitPassiveMountOnFiber (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8689:17)
    at recursivelyTraversePassiveMountEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8677:316)
    at commitPassiveMountOnFiber (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8689:17)
    at recursivelyTraversePassiveMountEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8677:316)
    at commitPassiveMountOnFiber (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8689:17)
    at recursivelyTraversePassiveMountEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8677:316)
    at commitPassiveMountOnFiber (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8694:17)
    at recursivelyTraversePassiveMountEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8677:316)
    at commitPassiveMountOnFiber (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8689:17)
    at recursivelyTraversePassiveMountEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8677:316)
    at commitPassiveMountOnFiber (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8689:17)
    at recursivelyTraversePassiveMountEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8677:316)
    at commitPassiveMountOnFiber (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8751:17)
    at recursivelyTraversePassiveMountEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8677:316)
    at commitPassiveMountOnFiber (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8751:17)
    at recursivelyTraversePassiveMountEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8677:316) (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_7a8122d0._.js:3117:31)
[ERROR] Failed to load resource: net::ERR_EMPTY_RESPONSE (at http://localhost:3000/__nextjs_original-stack-frames:0:0)
[ERROR] Failed to load resource: net::ERR_EMPTY_RESPONSE (at http://localhost:3000/__nextjs_original-stack-frames:0:0)
[ERROR] Failed to load resource: net::ERR_EMPTY_RESPONSE (at http://localhost:3000/api/user/scheduled-interviews:0:0)
[ERROR] Error fetching scheduled interviews: TypeError: Failed to fetch
    at fetchScheduledInterviews (http://localhost:3000/_next/static/chunks/_b0c47495._.js:587:36)
    at NotificationsDropdown.useEffect (http://localhost:3000/_next/static/chunks/_b0c47495._.js:577:13)
    at Object.react_stack_bottom_frame (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:14866:22)
    at runWithFiberInDEV (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:959:74)
    at commitHookEffectListMount (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:7260:167)
    at commitHookPassiveMountEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:7295:60)
    at reconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8780:17)
    at recursivelyTraverseReconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8767:13)
    at reconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8794:17)
    at recursivelyTraverseReconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8767:13)
    at reconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8794:17)
    at recursivelyTraverseReconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8767:13)
    at reconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8794:17)
    at recursivelyTraverseReconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8767:13)
    at reconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8779:17)
    at recursivelyTraverseReconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8767:13)
    at reconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8794:17)
    at recursivelyTraverseReconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8767:13)
    at reconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8779:17)
    at recursivelyTraverseReconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8767:13)
    at reconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8779:17)
    at recursivelyTraverseReconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8767:13)
    at reconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8779:17)
    at recursivelyTraverseReconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8767:13)
    at reconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8794:17)
    at recursivelyTraverseReconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8767:13)
    at reconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8794:17)
    at recursivelyTraverseReconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8767:13)
    at reconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8779:17)
    at recursivelyTraverseReconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8767:13)
    at reconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8794:17)
    at recursivelyTraverseReconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8767:13)
    at reconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8779:17)
    at recursivelyTraverseReconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8767:13)
    at reconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8779:17)
    at recursivelyTraverseReconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8767:13)
    at reconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8779:17)
    at recursivelyTraverseReconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8767:13)
    at reconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8779:17)
    at recursivelyTraverseReconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8767:13)
    at reconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8794:17)
    at recursivelyTraverseReconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8767:13)
    at reconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8779:17)
    at recursivelyTraverseReconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8767:13)
    at reconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8779:17)
    at recursivelyTraverseReconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8767:13)
    at reconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8794:17)
    at recursivelyTraverseReconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8767:13)
    at reconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8794:17)
    at recursivelyTraverseReconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8767:13) (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_7a8122d0._.js:3117:31)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/369d8679-8d09-4aa3-8d6f-fc06d9b2a645/80e27302-a76a-4c31-aefd-b975ed513720
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC003
- **Test Name:** DSA and Coding Interview Execution
- **Test Code:** [TC003_DSA_and_Coding_Interview_Execution.py](./TC003_DSA_and_Coding_Interview_Execution.py)
- **Test Error:** The user successfully logged in, navigated through the course selections, and reached the coding interview interface with difficulty and duration options. However, the test did not proceed to verify the real-time code editor loading, streaming interaction, speech recognition integration, code writing, running, and submission functionalities due to session interruptions and navigation issues. Therefore, the task is only partially completed.
Browser Console Logs:
[ERROR] Failed to load resource: net::ERR_EMPTY_RESPONSE (at https://unpkg.com/@splinetool/runtime@1.10.90/build/runtime.js:0:0)
[WARNING] Detected `scroll-behavior: smooth` on the `<html>` element. To disable smooth scrolling during route transitions, add `data-scroll-behavior="smooth"` to your <html> element. Learn more: https://nextjs.org/docs/messages/missing-data-scroll-behavior (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_7a8122d0._.js:2287:27)
[ERROR] [v0] AuthPage - useEffect: Client ready, session status: no_session (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_7a8122d0._.js:3117:31)
[ERROR] [v0] AuthPage - useEffect: Client ready, session status: no_session (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_7a8122d0._.js:3117:31)
[ERROR] [v0] Attempting to sign in with email: gaganbhuvan2027@gmail.com (Login flow) (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_7a8122d0._.js:3117:31)
[ERROR] [v0] Sign in response - Error: undefined Data: {user: Object, session: Object} (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_7a8122d0._.js:3117:31)
[ERROR] A tree hydrated but some attributes of the server rendered HTML didn't match the client properties. This won't be patched up. This can happen if a SSR-ed Client Component used:

- A server/client branch `if (typeof window !== 'undefined')`.
- Variable input such as `Date.now()` or `Math.random()` which changes each time it's called.
- Date formatting in a user's locale which doesn't match the server.
- External changing data without sending a snapshot of it along with the HTML.
- Invalid HTML tag nesting.

It can also happen if the client has a browser extension installed which messes with the HTML before React loaded.

%s%s https://react.dev/link/hydration-mismatch 

  ...
    <DashboardNavbar>
      <nav className="fixed top-...">
        <ExitOnPopstateExit>
        <div className="max-w-7xl ...">
          <LinkComponent>
          <div className="hidden md:...">
            <LinkComponent>
            <LinkComponent>
            <LinkComponent>
            <LinkComponent>
            <LinkComponent>
            <JoinInstituteModal triggerClassName="text-gray-...">
              <Dialog open={false} onOpenChange={function bound dispatchSetState}>
                <Dialog data-slot="dialog" open={false} onOpenChange={function bound dispatchSetState}>
                  <DialogProvider scope={undefined} triggerRef={{current:null}} contentRef={{current:null}} ...>
                    <DialogTrigger asChild={true}>
                      <DialogTrigger data-slot="dialog-tri..." asChild={true}>
                        <Primitive.button type="button" aria-haspopup="dialog" aria-expanded={false} ...>
                          <Slot type="button" aria-haspopup="dialog" aria-expanded={false} aria-controls="radix-_R_1..." ...>
                            <SlotClone type="button" aria-haspopup="dialog" aria-expanded={false} ...>
                              <Button variant="ghost" className="text-gray-..." onClick={function} type="button" ...>
                                <button
                                  data-slot="dialog-trigger"
                                  className={"inline-flex items-center justify-center gap-2 whitespace-nowrap rounded..."}
                                  onClick={function}
                                  type="button"
                                  aria-haspopup="dialog"
                                  aria-expanded={false}
+                                 aria-controls="radix-_R_1l9bn5rlb_"
-                                 aria-controls="radix-_R_6kpbn5rlb_"
                                  data-state="closed"
                                  ref={function}
                                >
+                                 Join Institute
                    ...
            ...
              <Slot ref={function}>
                <SlotClone ref={function}>
                  <Primitive.button aria-describedby={undefined} data-state="closed" data-slot="tooltip-tr..." ...>
                    <Slot aria-describedby={undefined} data-state="closed" data-slot="tooltip-tr..." ...>
                      <SlotClone aria-describedby={undefined} data-state="closed" data-slot="tooltip-tr..." ...>
                        <DialogTrigger asChild={true} aria-describedby={undefined} data-state="closed" ...>
                          <DialogTrigger data-slot="tooltip-tr..." asChild={true} aria-describedby={undefined} ...>
                            <Primitive.button type="button" aria-haspopup="dialog" aria-expanded={false} ...>
                              <Slot type="button" aria-haspopup="dialog" aria-expanded={false} ...>
                                <SlotClone type="button" aria-haspopup="dialog" aria-expanded={false} ...>
                                  <button
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue..."
                                    type="button"
                                    aria-haspopup="dialog"
                                    aria-expanded={false}
+                                   aria-controls="radix-_R_1t9bn5rlb_"
-                                   aria-controls="radix-_R_7kpbn5rlb_"
                                    data-state="closed"
                                    data-slot="tooltip-trigger"
                                    aria-describedby={undefined}
                                    onPointerMove={function handleEvent}
                                    onPointerLeave={function handleEvent}
                                    onPointerDown={function handleEvent}
                                    onFocus={function handleEvent}
                                    onBlur={function handleEvent}
                                    onClick={function handleEvent}
                                    ref={function}
                                  >
            ...
              <DropdownMenuTrigger asChild={true}>
                <DropdownMenuTrigger data-slot="dropdown-m..." asChild={true}>
                  <MenuAnchor asChild={true} __scopeMenu={{Menu:[...], ...}}>
                    <PopperAnchor __scopePopper={{Menu:[...], ...}} asChild={true} ref={null}>
                      <Primitive.div asChild={true} ref={function}>
                        <Primitive.div.Slot ref={function}>
                          <Primitive.div.SlotClone ref={function}>
                            <Primitive.button type="button" id="radix-_R_2..." aria-haspopup="menu" aria-expanded={false} ...>
                              <Primitive.button.Slot type="button" id="radix-_R_2..." aria-haspopup="menu" ...>
                                <Primitive.button.SlotClone type="button" id="radix-_R_2..." aria-haspopup="menu" ...>
                                  <button
                                    className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                    type="button"
+                                   id="radix-_R_259bn5rlb_"
-                                   id="radix-_R_8kpbn5rlb_"
                                    aria-haspopup="menu"
                                    aria-expanded={false}
                                    aria-controls={undefined}
                                    data-state="closed"
                                    data-disabled={undefined}
                                    disabled={false}
                                    data-slot="dropdown-menu-trigger"
                                    onPointerDown={function handleEvent}
                                    onKeyDown={function handleEvent}
                                    ref={function}
                                  >
            ...
              <DropdownMenuTrigger asChild={true}>
                <DropdownMenuTrigger data-slot="dropdown-m..." asChild={true}>
                  <MenuAnchor asChild={true} __scopeMenu={{Menu:[...], ...}}>
                    <PopperAnchor __scopePopper={{Menu:[...], ...}} asChild={true} ref={null}>
                      <Primitive.div asChild={true} ref={function}>
                        <Primitive.div.Slot ref={function}>
                          <Primitive.div.SlotClone ref={function}>
                            <Primitive.button type="button" id="radix-_R_2..." aria-haspopup="menu" aria-expanded={false} ...>
                              <Primitive.button.Slot type="button" id="radix-_R_2..." aria-haspopup="menu" ...>
                                <Primitive.button.SlotClone type="button" id="radix-_R_2..." aria-haspopup="menu" ...>
                                  <button
                                    className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                                    type="button"
+                                   id="radix-_R_2d9bn5rlb_"
-                                   id="radix-_R_9kpbn5rlb_"
                                    aria-haspopup="menu"
                                    aria-expanded={false}
                                    aria-controls={undefined}
                                    data-state="closed"
                                    data-disabled={undefined}
                                    disabled={false}
                                    data-slot="dropdown-menu-trigger"
                                    onPointerDown={function handleEvent}
                                    onKeyDown={function handleEvent}
                                    ref={function}
                                  >
          ...
 (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_7a8122d0._.js:3117:31)
[WARNING] Detected `scroll-behavior: smooth` on the `<html>` element. To disable smooth scrolling during route transitions, add `data-scroll-behavior="smooth"` to your <html> element. Learn more: https://nextjs.org/docs/messages/missing-data-scroll-behavior (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_7a8122d0._.js:2287:27)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/user/credits:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/user/scheduled-interviews:0:0)
[ERROR] CreditsDisplay - fetchCredits: Error in API response: Unauthorized (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_7a8122d0._.js:3117:31)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/user/credits:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/user/credits:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/user/credits:0:0)
[ERROR] [v0] AuthPage - useEffect: Client ready, session status: no_session (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_7a8122d0._.js:3117:31)
[ERROR] [v0] AuthPage - useEffect: Client ready, session status: no_session (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_7a8122d0._.js:3117:31)
[ERROR] [v0] Attempting to sign in with email: gaganbhuvan2027@gmail.com (Login flow) (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_7a8122d0._.js:3117:31)
[ERROR] [v0] Sign in response - Error: undefined Data: {user: Object, session: Object} (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_7a8122d0._.js:3117:31)
[WARNING] Detected `scroll-behavior: smooth` on the `<html>` element. To disable smooth scrolling during route transitions, add `data-scroll-behavior="smooth"` to your <html> element. Learn more: https://nextjs.org/docs/messages/missing-data-scroll-behavior (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_7a8122d0._.js:2287:27)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/369d8679-8d09-4aa3-8d6f-fc06d9b2a645/b550b131-f4a6-49e6-bff6-cbb5cdbdfa04
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC004
- **Test Name:** AI-Generated Interview Feedback and Performance Analysis
- **Test Code:** [TC004_AI_Generated_Interview_Feedback_and_Performance_Analysis.py](./TC004_AI_Generated_Interview_Feedback_and_Performance_Analysis.py)
- **Test Error:** The task to validate AI feedback and detailed interview analysis after interview submission could not be completed due to a critical client-side React hydration error on the interview history page. This error prevented access to past interviews, blocking the ability to complete interviews and receive AI analysis. The issue has been reported. Further testing is halted until the issue is resolved.
Browser Console Logs:
[ERROR] Failed to load resource: net::ERR_EMPTY_RESPONSE (at https://app.spline.design/_assets/_icons/icon_favicon32x32.png:0:0)
[WARNING] [GroupMarkerNotSet(crbug.com/242999)!:A0C43B00E4030000]Automatic fallback to software WebGL has been deprecated. Please use the --enable-unsafe-swiftshader flag to opt in to lower security guarantees for trusted content. (at https://my.spline.design/interactiveaiwebsite-j7qGbx3fJXOPFA20l5QVcZaz/:0:0)
[WARNING] [.WebGL-0x3e4066f4d00]GL Driver Message (OpenGL, Performance, GL_CLOSE_PATH_NV, High): GPU stall due to ReadPixels (at https://my.spline.design/interactiveaiwebsite-j7qGbx3fJXOPFA20l5QVcZaz/:0:0)
[WARNING] [.WebGL-0x3e4066f4d00]GL Driver Message (OpenGL, Performance, GL_CLOSE_PATH_NV, High): GPU stall due to ReadPixels (at https://my.spline.design/interactiveaiwebsite-j7qGbx3fJXOPFA20l5QVcZaz/:0:0)
[WARNING] [.WebGL-0x3e4066f4d00]GL Driver Message (OpenGL, Performance, GL_CLOSE_PATH_NV, High): GPU stall due to ReadPixels (at https://my.spline.design/interactiveaiwebsite-j7qGbx3fJXOPFA20l5QVcZaz/:0:0)
[WARNING] [.WebGL-0x3e4066f4d00]GL Driver Message (OpenGL, Performance, GL_CLOSE_PATH_NV, High): GPU stall due to ReadPixels (this message will no longer repeat) (at https://my.spline.design/interactiveaiwebsite-j7qGbx3fJXOPFA20l5QVcZaz/:0:0)
[ERROR] Failed to load resource: net::ERR_EMPTY_RESPONSE (at http://localhost:3000/auth?_rsc=vusbg:0:0)
[ERROR] Failed to fetch RSC payload for http://localhost:3000/auth. Falling back to browser navigation. TypeError: Failed to fetch
    at createFetch (http://localhost:3000/_next/static/chunks/node_modules_next_dist_client_aaee43fe._.js:2552:24)
    at fetchServerResponse (http://localhost:3000/_next/static/chunks/node_modules_next_dist_client_aaee43fe._.js:2456:27)
    at navigateDynamicallyWithNoPrefetch (http://localhost:3000/_next/static/chunks/node_modules_next_dist_client_aaee43fe._.js:7604:90)
    at navigate (http://localhost:3000/_next/static/chunks/node_modules_next_dist_client_aaee43fe._.js:7423:15)
    at navigateReducer (http://localhost:3000/_next/static/chunks/node_modules_next_dist_client_aaee43fe._.js:7899:45)
    at clientReducer (http://localhost:3000/_next/static/chunks/node_modules_next_dist_client_aaee43fe._.js:12245:61)
    at Object.action (http://localhost:3000/_next/static/chunks/node_modules_next_dist_client_aaee43fe._.js:12491:55)
    at runAction (http://localhost:3000/_next/static/chunks/node_modules_next_dist_client_aaee43fe._.js:12396:38)
    at dispatchAction (http://localhost:3000/_next/static/chunks/node_modules_next_dist_client_aaee43fe._.js:12459:9)
    at Object.dispatch (http://localhost:3000/_next/static/chunks/node_modules_next_dist_client_aaee43fe._.js:12489:40)
    at http://localhost:3000/_next/static/chunks/node_modules_next_dist_client_aaee43fe._.js:1442:29
    at startTransition (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:5494:31)
    at dispatch (http://localhost:3000/_next/static/chunks/node_modules_next_dist_client_aaee43fe._.js:1441:13)
    at dispatchAppRouterAction (http://localhost:3000/_next/static/chunks/node_modules_next_dist_client_aaee43fe._.js:1423:5)
    at dispatchNavigateAction (http://localhost:3000/_next/static/chunks/node_modules_next_dist_client_aaee43fe._.js:12543:49)
    at http://localhost:3000/_next/static/chunks/_5b12fa4a._.js:1863:13
    at Object.startTransition (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_a0e4c7b4._.js:1279:31)
    at linkClicked (http://localhost:3000/_next/static/chunks/_5b12fa4a._.js:1862:24)
    at onClick (http://localhost:3000/_next/static/chunks/_5b12fa4a._.js:2103:13)
    at executeDispatch (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:10308:13)
    at runWithFiberInDEV (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:959:74)
    at processDispatchQueue (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:10334:41)
    at http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:10609:13
    at batchedUpdates$1 (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:2247:44)
    at dispatchEventForPluginEventSystem (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:10410:9)
    at dispatchEvent (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:12925:37)
    at dispatchDiscreteEvent (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:12907:64)
    at eval (eval at evaluate (:234:30), <anonymous>:1:12)
    at UtilityScript.evaluate (<anonymous>:241:19)
    at UtilityScript.<anonymous> (<anonymous>:1:44) (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_7a8122d0._.js:3117:31)
[ERROR] [v0] AuthPage - useEffect: Client ready, session status: no_session (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_7a8122d0._.js:3117:31)
[ERROR] [v0] Attempting to sign in with email: gaganbhuvan2027@gmail.com (Login flow) (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_7a8122d0._.js:3117:31)
[ERROR] [v0] Sign in response - Error: undefined Data: {user: Object, session: Object} (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_7a8122d0._.js:3117:31)
[ERROR] A tree hydrated but some attributes of the server rendered HTML didn't match the client properties. This won't be patched up. This can happen if a SSR-ed Client Component used:

- A server/client branch `if (typeof window !== 'undefined')`.
- Variable input such as `Date.now()` or `Math.random()` which changes each time it's called.
- Date formatting in a user's locale which doesn't match the server.
- External changing data without sending a snapshot of it along with the HTML.
- Invalid HTML tag nesting.

It can also happen if the client has a browser extension installed which messes with the HTML before React loaded.

%s%s https://react.dev/link/hydration-mismatch 

  ...
    <DashboardNavbar>
      <nav className="fixed top-...">
        <ExitOnPopstateExit>
        <div className="max-w-7xl ...">
          <LinkComponent>
          <div className="hidden md:...">
            <LinkComponent>
            <LinkComponent>
            <LinkComponent>
            <LinkComponent>
            <LinkComponent>
            <JoinInstituteModal triggerClassName="text-gray-...">
              <Dialog open={false} onOpenChange={function bound dispatchSetState}>
                <Dialog data-slot="dialog" open={false} onOpenChange={function bound dispatchSetState}>
                  <DialogProvider scope={undefined} triggerRef={{current:null}} contentRef={{current:null}} ...>
                    <DialogTrigger asChild={true}>
                      <DialogTrigger data-slot="dialog-tri..." asChild={true}>
                        <Primitive.button type="button" aria-haspopup="dialog" aria-expanded={false} ...>
                          <Slot type="button" aria-haspopup="dialog" aria-expanded={false} aria-controls="radix-_R_1..." ...>
                            <SlotClone type="button" aria-haspopup="dialog" aria-expanded={false} ...>
                              <Button variant="ghost" className="text-gray-..." onClick={function} type="button" ...>
                                <button
                                  data-slot="dialog-trigger"
                                  className={"inline-flex items-center justify-center gap-2 whitespace-nowrap rounded..."}
                                  onClick={function}
                                  type="button"
                                  aria-haspopup="dialog"
                                  aria-expanded={false}
+                                 aria-controls="radix-_R_1l9bn5rlb_"
-                                 aria-controls="radix-_R_6kpbn5rlb_"
                                  data-state="closed"
                                  ref={function}
                                >
+                                 Join Institute
                    ...
            ...
              <Slot ref={function}>
                <SlotClone ref={function}>
                  <Primitive.button aria-describedby={undefined} data-state="closed" data-slot="tooltip-tr..." ...>
                    <Slot aria-describedby={undefined} data-state="closed" data-slot="tooltip-tr..." ...>
                      <SlotClone aria-describedby={undefined} data-state="closed" data-slot="tooltip-tr..." ...>
                        <DialogTrigger asChild={true} aria-describedby={undefined} data-state="closed" ...>
                          <DialogTrigger data-slot="tooltip-tr..." asChild={true} aria-describedby={undefined} ...>
                            <Primitive.button type="button" aria-haspopup="dialog" aria-expanded={false} ...>
                              <Slot type="button" aria-haspopup="dialog" aria-expanded={false} ...>
                                <SlotClone type="button" aria-haspopup="dialog" aria-expanded={false} ...>
                                  <button
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue..."
                                    type="button"
                                    aria-haspopup="dialog"
                                    aria-expanded={false}
+                                   aria-controls="radix-_R_1t9bn5rlb_"
-                                   aria-controls="radix-_R_7kpbn5rlb_"
                                    data-state="closed"
                                    data-slot="tooltip-trigger"
                                    aria-describedby={undefined}
                                    onPointerMove={function handleEvent}
                                    onPointerLeave={function handleEvent}
                                    onPointerDown={function handleEvent}
                                    onFocus={function handleEvent}
                                    onBlur={function handleEvent}
                                    onClick={function handleEvent}
                                    ref={function}
                                  >
            ...
              <DropdownMenuTrigger asChild={true}>
                <DropdownMenuTrigger data-slot="dropdown-m..." asChild={true}>
                  <MenuAnchor asChild={true} __scopeMenu={{Menu:[...], ...}}>
                    <PopperAnchor __scopePopper={{Menu:[...], ...}} asChild={true} ref={null}>
                      <Primitive.div asChild={true} ref={function}>
                        <Primitive.div.Slot ref={function}>
                          <Primitive.div.SlotClone ref={function}>
                            <Primitive.button type="button" id="radix-_R_2..." aria-haspopup="menu" aria-expanded={false} ...>
                              <Primitive.button.Slot type="button" id="radix-_R_2..." aria-haspopup="menu" ...>
                                <Primitive.button.SlotClone type="button" id="radix-_R_2..." aria-haspopup="menu" ...>
                                  <button
                                    className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                    type="button"
+                                   id="radix-_R_259bn5rlb_"
-                                   id="radix-_R_8kpbn5rlb_"
                                    aria-haspopup="menu"
                                    aria-expanded={false}
                                    aria-controls={undefined}
                                    data-state="closed"
                                    data-disabled={undefined}
                                    disabled={false}
                                    data-slot="dropdown-menu-trigger"
                                    onPointerDown={function handleEvent}
                                    onKeyDown={function handleEvent}
                                    ref={function}
                                  >
            ...
              <DropdownMenuTrigger asChild={true}>
                <DropdownMenuTrigger data-slot="dropdown-m..." asChild={true}>
                  <MenuAnchor asChild={true} __scopeMenu={{Menu:[...], ...}}>
                    <PopperAnchor __scopePopper={{Menu:[...], ...}} asChild={true} ref={null}>
                      <Primitive.div asChild={true} ref={function}>
                        <Primitive.div.Slot ref={function}>
                          <Primitive.div.SlotClone ref={function}>
                            <Primitive.button type="button" id="radix-_R_2..." aria-haspopup="menu" aria-expanded={false} ...>
                              <Primitive.button.Slot type="button" id="radix-_R_2..." aria-haspopup="menu" ...>
                                <Primitive.button.SlotClone type="button" id="radix-_R_2..." aria-haspopup="menu" ...>
                                  <button
                                    className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                                    type="button"
+                                   id="radix-_R_2d9bn5rlb_"
-                                   id="radix-_R_9kpbn5rlb_"
                                    aria-haspopup="menu"
                                    aria-expanded={false}
                                    aria-controls={undefined}
                                    data-state="closed"
                                    data-disabled={undefined}
                                    disabled={false}
                                    data-slot="dropdown-menu-trigger"
                                    onPointerDown={function handleEvent}
                                    onKeyDown={function handleEvent}
                                    ref={function}
                                  >
          ...
 (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_7a8122d0._.js:3117:31)
[ERROR] Failed to load resource: net::ERR_EMPTY_RESPONSE (at http://localhost:3000/_next/static/chunks/node_modules_6eace213._.js:0:0)
[ERROR] Failed to load resource: net::ERR_EMPTY_RESPONSE (at http://localhost:3000/_next/static/chunks/app_history_page_tsx_a83ff2b8._.js:0:0)
[ERROR] Failed to load resource: net::ERR_EMPTY_RESPONSE (at http://localhost:3000/_next/static/chunks/_14680e6b._.js:0:0)
[ERROR] Failed to load resource: net::ERR_EMPTY_RESPONSE (at http://localhost:3000/__nextjs_font/geist-mono-latin.woff2:0:0)
[ERROR] Failed to load resource: net::ERR_EMPTY_RESPONSE (at http://localhost:3000/__nextjs_original-stack-frames:0:0)
[ERROR] WebSocket connection to 'ws://localhost:3000/_next/webpack-hmr?id=AKp6_MEwOcpzRkewlow0O' failed: Error in connection establishment: net::ERR_EMPTY_RESPONSE (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_client_aaee43fe._.js:10115:0)
[ERROR] WebSocket connection to 'ws://localhost:3000/_next/webpack-hmr?id=AKp6_MEwOcpzRkewlow0O' failed: Error in connection establishment: net::ERR_EMPTY_RESPONSE (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_client_aaee43fe._.js:10115:0)
[ERROR] WebSocket connection to 'ws://localhost:3000/_next/webpack-hmr?id=AKp6_MEwOcpzRkewlow0O' failed: Error in connection establishment: net::ERR_EMPTY_RESPONSE (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_client_aaee43fe._.js:10115:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/369d8679-8d09-4aa3-8d6f-fc06d9b2a645/5814c737-0577-4a5c-a8f9-26c169795faa
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC005
- **Test Name:** Institution Course, Batch, and Interview Scheduling Management
- **Test Code:** [TC005_Institution_Course_Batch_and_Interview_Scheduling_Management.py](./TC005_Institution_Course_Batch_and_Interview_Scheduling_Management.py)
- **Test Error:** The institution user was able to log in and navigate to the course management and institute sections. However, no visible options or buttons were found to create, edit, or delete courses within the course management interface. Similarly, batch creation and user assignment features were not accessible due to sign-in restrictions on the 'My Institute' page. Interview scheduling options were not encountered or accessible during the session. Therefore, the full verification of managing courses, creating batches, and scheduling interviews could not be completed. No data inconsistencies were observed in the accessible parts of the system. Further access or permissions may be required to fully test these features.
Browser Console Logs:
[ERROR] Failed to load resource: net::ERR_EMPTY_RESPONSE (at https://unpkg.com/@splinetool/runtime@1.10.90/build/runtime.js:0:0)
[ERROR] Failed to load resource: net::ERR_EMPTY_RESPONSE (at https://app.spline.design/_assets/_icons/icon_favicon32x32.png:0:0)
[WARNING] Detected `scroll-behavior: smooth` on the `<html>` element. To disable smooth scrolling during route transitions, add `data-scroll-behavior="smooth"` to your <html> element. Learn more: https://nextjs.org/docs/messages/missing-data-scroll-behavior (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_7a8122d0._.js:2287:27)
[ERROR] [v0] AuthPage - useEffect: Client ready, session status: no_session (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_7a8122d0._.js:3117:31)
[ERROR] [v0] AuthPage - useEffect: Client ready, session status: no_session (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_7a8122d0._.js:3117:31)
[ERROR] [v0] Attempting to sign in with email: gaganbhuvan2027@gmail.com (Login flow) (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_7a8122d0._.js:3117:31)
[ERROR] [v0] Sign in response - Error: undefined Data: {user: Object, session: Object} (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_7a8122d0._.js:3117:31)
[ERROR] A tree hydrated but some attributes of the server rendered HTML didn't match the client properties. This won't be patched up. This can happen if a SSR-ed Client Component used:

- A server/client branch `if (typeof window !== 'undefined')`.
- Variable input such as `Date.now()` or `Math.random()` which changes each time it's called.
- Date formatting in a user's locale which doesn't match the server.
- External changing data without sending a snapshot of it along with the HTML.
- Invalid HTML tag nesting.

It can also happen if the client has a browser extension installed which messes with the HTML before React loaded.

%s%s https://react.dev/link/hydration-mismatch 

  ...
    <DashboardNavbar>
      <nav className="fixed top-...">
        <ExitOnPopstateExit>
        <div className="max-w-7xl ...">
          <LinkComponent>
          <div className="hidden md:...">
            <LinkComponent>
            <LinkComponent>
            <LinkComponent>
            <LinkComponent>
            <LinkComponent>
            <JoinInstituteModal triggerClassName="text-gray-...">
              <Dialog open={false} onOpenChange={function bound dispatchSetState}>
                <Dialog data-slot="dialog" open={false} onOpenChange={function bound dispatchSetState}>
                  <DialogProvider scope={undefined} triggerRef={{current:null}} contentRef={{current:null}} ...>
                    <DialogTrigger asChild={true}>
                      <DialogTrigger data-slot="dialog-tri..." asChild={true}>
                        <Primitive.button type="button" aria-haspopup="dialog" aria-expanded={false} ...>
                          <Slot type="button" aria-haspopup="dialog" aria-expanded={false} aria-controls="radix-_R_1..." ...>
                            <SlotClone type="button" aria-haspopup="dialog" aria-expanded={false} ...>
                              <Button variant="ghost" className="text-gray-..." onClick={function} type="button" ...>
                                <button
                                  data-slot="dialog-trigger"
                                  className={"inline-flex items-center justify-center gap-2 whitespace-nowrap rounded..."}
                                  onClick={function}
                                  type="button"
                                  aria-haspopup="dialog"
                                  aria-expanded={false}
+                                 aria-controls="radix-_R_1l9bn5rlb_"
-                                 aria-controls="radix-_R_6kpbn5rlb_"
                                  data-state="closed"
                                  ref={function}
                                >
+                                 Join Institute
                    ...
            ...
              <Slot ref={function}>
                <SlotClone ref={function}>
                  <Primitive.button aria-describedby={undefined} data-state="closed" data-slot="tooltip-tr..." ...>
                    <Slot aria-describedby={undefined} data-state="closed" data-slot="tooltip-tr..." ...>
                      <SlotClone aria-describedby={undefined} data-state="closed" data-slot="tooltip-tr..." ...>
                        <DialogTrigger asChild={true} aria-describedby={undefined} data-state="closed" ...>
                          <DialogTrigger data-slot="tooltip-tr..." asChild={true} aria-describedby={undefined} ...>
                            <Primitive.button type="button" aria-haspopup="dialog" aria-expanded={false} ...>
                              <Slot type="button" aria-haspopup="dialog" aria-expanded={false} ...>
                                <SlotClone type="button" aria-haspopup="dialog" aria-expanded={false} ...>
                                  <button
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue..."
                                    type="button"
                                    aria-haspopup="dialog"
                                    aria-expanded={false}
+                                   aria-controls="radix-_R_1t9bn5rlb_"
-                                   aria-controls="radix-_R_7kpbn5rlb_"
                                    data-state="closed"
                                    data-slot="tooltip-trigger"
                                    aria-describedby={undefined}
                                    onPointerMove={function handleEvent}
                                    onPointerLeave={function handleEvent}
                                    onPointerDown={function handleEvent}
                                    onFocus={function handleEvent}
                                    onBlur={function handleEvent}
                                    onClick={function handleEvent}
                                    ref={function}
                                  >
            ...
              <DropdownMenuTrigger asChild={true}>
                <DropdownMenuTrigger data-slot="dropdown-m..." asChild={true}>
                  <MenuAnchor asChild={true} __scopeMenu={{Menu:[...], ...}}>
                    <PopperAnchor __scopePopper={{Menu:[...], ...}} asChild={true} ref={null}>
                      <Primitive.div asChild={true} ref={function}>
                        <Primitive.div.Slot ref={function}>
                          <Primitive.div.SlotClone ref={function}>
                            <Primitive.button type="button" id="radix-_R_2..." aria-haspopup="menu" aria-expanded={false} ...>
                              <Primitive.button.Slot type="button" id="radix-_R_2..." aria-haspopup="menu" ...>
                                <Primitive.button.SlotClone type="button" id="radix-_R_2..." aria-haspopup="menu" ...>
                                  <button
                                    className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                    type="button"
+                                   id="radix-_R_259bn5rlb_"
-                                   id="radix-_R_8kpbn5rlb_"
                                    aria-haspopup="menu"
                                    aria-expanded={false}
                                    aria-controls={undefined}
                                    data-state="closed"
                                    data-disabled={undefined}
                                    disabled={false}
                                    data-slot="dropdown-menu-trigger"
                                    onPointerDown={function handleEvent}
                                    onKeyDown={function handleEvent}
                                    ref={function}
                                  >
            ...
              <DropdownMenuTrigger asChild={true}>
                <DropdownMenuTrigger data-slot="dropdown-m..." asChild={true}>
                  <MenuAnchor asChild={true} __scopeMenu={{Menu:[...], ...}}>
                    <PopperAnchor __scopePopper={{Menu:[...], ...}} asChild={true} ref={null}>
                      <Primitive.div asChild={true} ref={function}>
                        <Primitive.div.Slot ref={function}>
                          <Primitive.div.SlotClone ref={function}>
                            <Primitive.button type="button" id="radix-_R_2..." aria-haspopup="menu" aria-expanded={false} ...>
                              <Primitive.button.Slot type="button" id="radix-_R_2..." aria-haspopup="menu" ...>
                                <Primitive.button.SlotClone type="button" id="radix-_R_2..." aria-haspopup="menu" ...>
                                  <button
                                    className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                                    type="button"
+                                   id="radix-_R_2d9bn5rlb_"
-                                   id="radix-_R_9kpbn5rlb_"
                                    aria-haspopup="menu"
                                    aria-expanded={false}
                                    aria-controls={undefined}
                                    data-state="closed"
                                    data-disabled={undefined}
                                    disabled={false}
                                    data-slot="dropdown-menu-trigger"
                                    onPointerDown={function handleEvent}
                                    onKeyDown={function handleEvent}
                                    ref={function}
                                  >
          ...
 (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_7a8122d0._.js:3117:31)
[WARNING] Detected `scroll-behavior: smooth` on the `<html>` element. To disable smooth scrolling during route transitions, add `data-scroll-behavior="smooth"` to your <html> element. Learn more: https://nextjs.org/docs/messages/missing-data-scroll-behavior (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_7a8122d0._.js:2287:27)
[ERROR] [v0] Permission check failed: TypeError: Failed to execute 'query' on 'Permissions': Illegal invocation
    at window.navigator.permissions.query (<anonymous>:31:21)
    at AudioVideoInterviewer.useEffect.checkPermissions (http://localhost:3000/_next/static/chunks/_f2dbcc2c._.js:2573:71)
    at AudioVideoInterviewer.useEffect (http://localhost:3000/_next/static/chunks/_f2dbcc2c._.js:2596:13)
    at Object.react_stack_bottom_frame (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:14866:22)
    at runWithFiberInDEV (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:959:74)
    at commitHookEffectListMount (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:7260:167)
    at commitHookPassiveMountEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:7295:60)
    at reconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8780:17)
    at recursivelyTraverseReconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8767:13)
    at reconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8779:17)
    at recursivelyTraverseReconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8767:13)
    at reconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8786:443)
    at recursivelyTraverseReconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8767:13)
    at reconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8794:17)
    at recursivelyTraverseReconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8767:13)
    at reconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8779:17)
    at recursivelyTraverseReconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8767:13)
    at reconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8794:17)
    at recursivelyTraverseReconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8767:13)
    at reconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8794:17)
    at recursivelyTraverseReconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8767:13)
    at reconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8794:17)
    at recursivelyTraverseReconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8767:13)
    at reconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8779:17)
    at recursivelyTraverseReconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8767:13)
    at commitPassiveMountOnFiber (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8739:970)
    at recursivelyTraversePassiveMountEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8677:316)
    at commitPassiveMountOnFiber (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8731:17)
    at recursivelyTraversePassiveMountEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8677:316)
    at commitPassiveMountOnFiber (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8689:17)
    at recursivelyTraversePassiveMountEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8677:316)
    at commitPassiveMountOnFiber (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8751:17)
    at recursivelyTraversePassiveMountEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8677:316)
    at commitPassiveMountOnFiber (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8751:17)
    at recursivelyTraversePassiveMountEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8677:316)
    at commitPassiveMountOnFiber (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8689:17)
    at recursivelyTraversePassiveMountEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8677:316)
    at commitPassiveMountOnFiber (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8694:17)
    at recursivelyTraversePassiveMountEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8677:316)
    at commitPassiveMountOnFiber (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8689:17)
    at recursivelyTraversePassiveMountEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8677:316)
    at commitPassiveMountOnFiber (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8689:17)
    at recursivelyTraversePassiveMountEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8677:316)
    at commitPassiveMountOnFiber (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8739:783)
    at recursivelyTraversePassiveMountEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8677:316)
    at commitPassiveMountOnFiber (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8731:17)
    at recursivelyTraversePassiveMountEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8677:316)
    at commitPassiveMountOnFiber (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8689:17)
    at recursivelyTraversePassiveMountEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8677:316)
    at commitPassiveMountOnFiber (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8689:17) (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_7a8122d0._.js:3117:31)
[ERROR] [v0] Permission check failed: TypeError: Failed to execute 'query' on 'Permissions': Illegal invocation
    at window.navigator.permissions.query (<anonymous>:31:21)
    at AudioVideoInterviewer.useEffect.checkPermissions (http://localhost:3000/_next/static/chunks/_f2dbcc2c._.js:2573:71)
    at AudioVideoInterviewer.useEffect (http://localhost:3000/_next/static/chunks/_f2dbcc2c._.js:2596:13)
    at Object.react_stack_bottom_frame (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:14866:22)
    at runWithFiberInDEV (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:959:74)
    at commitHookEffectListMount (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:7260:167)
    at commitHookPassiveMountEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:7295:60)
    at reconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8780:17)
    at recursivelyTraverseReconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8767:13)
    at reconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8779:17)
    at recursivelyTraverseReconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8767:13)
    at reconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8786:443)
    at recursivelyTraverseReconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8767:13)
    at reconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8794:17)
    at recursivelyTraverseReconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8767:13)
    at reconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8779:17)
    at recursivelyTraverseReconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8767:13)
    at reconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8794:17)
    at recursivelyTraverseReconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8767:13)
    at reconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8794:17)
    at recursivelyTraverseReconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8767:13)
    at reconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8794:17)
    at recursivelyTraverseReconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8767:13)
    at reconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8779:17)
    at recursivelyTraverseReconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8767:13)
    at reconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8786:443)
    at doubleInvokeEffectsOnFiber (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:10086:133)
    at runWithFiberInDEV (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:959:131)
    at recursivelyTraverseAndDoubleInvokeEffectsInDEV (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:10079:303)
    at recursivelyTraverseAndDoubleInvokeEffectsInDEV (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:10079:147)
    at recursivelyTraverseAndDoubleInvokeEffectsInDEV (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:10079:147)
    at recursivelyTraverseAndDoubleInvokeEffectsInDEV (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:10079:147)
    at recursivelyTraverseAndDoubleInvokeEffectsInDEV (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:10079:147)
    at recursivelyTraverseAndDoubleInvokeEffectsInDEV (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:10079:147)
    at recursivelyTraverseAndDoubleInvokeEffectsInDEV (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:10079:147)
    at recursivelyTraverseAndDoubleInvokeEffectsInDEV (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:10079:147)
    at recursivelyTraverseAndDoubleInvokeEffectsInDEV (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:10079:147)
    at runWithFiberInDEV (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:959:131)
    at recursivelyTraverseAndDoubleInvokeEffectsInDEV (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:10079:405)
    at recursivelyTraverseAndDoubleInvokeEffectsInDEV (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:10079:147)
    at recursivelyTraverseAndDoubleInvokeEffectsInDEV (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:10079:147)
    at recursivelyTraverseAndDoubleInvokeEffectsInDEV (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:10079:147)
    at recursivelyTraverseAndDoubleInvokeEffectsInDEV (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:10079:147)
    at recursivelyTraverseAndDoubleInvokeEffectsInDEV (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:10079:147)
    at recursivelyTraverseAndDoubleInvokeEffectsInDEV (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:10079:147)
    at recursivelyTraverseAndDoubleInvokeEffectsInDEV (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:10079:147)
    at recursivelyTraverseAndDoubleInvokeEffectsInDEV (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:10079:147)
    at recursivelyTraverseAndDoubleInvokeEffectsInDEV (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:10079:147)
    at recursivelyTraverseAndDoubleInvokeEffectsInDEV (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:10079:147)
    at recursivelyTraverseAndDoubleInvokeEffectsInDEV (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:10079:147) (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_7a8122d0._.js:3117:31)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/user/credits:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/user/credits:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/user/scheduled-interviews:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/user/credits:0:0)
[ERROR] CreditsDisplay - fetchCredits: Error in API response: Unauthorized (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_7a8122d0._.js:3117:31)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/user/scheduled-interviews:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/user/credits:0:0)
[ERROR] CreditsDisplay - fetchCredits: Error in API response: Unauthorized (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_7a8122d0._.js:3117:31)
[ERROR] [v0] Permission check failed: TypeError: Failed to execute 'query' on 'Permissions': Illegal invocation
    at window.navigator.permissions.query (<anonymous>:31:21)
    at AudioVideoInterviewer.useEffect.checkPermissions (http://localhost:3000/_next/static/chunks/_f2dbcc2c._.js:2573:71)
    at AudioVideoInterviewer.useEffect (http://localhost:3000/_next/static/chunks/_f2dbcc2c._.js:2596:13)
    at Object.react_stack_bottom_frame (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:14866:22)
    at runWithFiberInDEV (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:959:74)
    at commitHookEffectListMount (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:7260:167)
    at commitHookPassiveMountEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:7295:60)
    at reconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8780:17)
    at recursivelyTraverseReconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8767:13)
    at reconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8779:17)
    at recursivelyTraverseReconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8767:13)
    at reconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8786:443)
    at recursivelyTraverseReconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8767:13)
    at reconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8794:17)
    at recursivelyTraverseReconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8767:13)
    at reconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8779:17)
    at recursivelyTraverseReconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8767:13)
    at reconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8794:17)
    at recursivelyTraverseReconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8767:13)
    at reconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8794:17)
    at recursivelyTraverseReconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8767:13)
    at reconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8794:17)
    at recursivelyTraverseReconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8767:13)
    at reconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8779:17)
    at recursivelyTraverseReconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8767:13)
    at reconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8786:443)
    at recursivelyTraverseReconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8767:13)
    at reconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8794:17)
    at recursivelyTraverseReconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8767:13)
    at reconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8779:17)
    at recursivelyTraverseReconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8767:13)
    at reconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8794:17)
    at recursivelyTraverseReconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8767:13)
    at reconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8794:17)
    at recursivelyTraverseReconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8767:13)
    at reconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8779:17)
    at recursivelyTraverseReconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8767:13)
    at reconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8794:17)
    at recursivelyTraverseReconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8767:13)
    at reconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8779:17)
    at recursivelyTraverseReconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8767:13)
    at reconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8779:17)
    at recursivelyTraverseReconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8767:13)
    at commitPassiveMountOnFiber (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8739:970)
    at recursivelyTraversePassiveMountEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8677:316)
    at commitPassiveMountOnFiber (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8731:17)
    at recursivelyTraversePassiveMountEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8677:316)
    at commitPassiveMountOnFiber (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8689:17)
    at recursivelyTraversePassiveMountEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8677:316)
    at commitPassiveMountOnFiber (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8689:17) (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_7a8122d0._.js:3117:31)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/369d8679-8d09-4aa3-8d6f-fc06d9b2a645/ef19e826-83aa-4bc3-8dac-bd48a50244b8
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC006
- **Test Name:** User Dashboard and Admin Panel Accessibility and Controls
- **Test Code:** [TC006_User_Dashboard_and_Admin_Panel_Accessibility_and_Controls.py](./TC006_User_Dashboard_and_Admin_Panel_Accessibility_and_Controls.py)
- **Test Error:** Testing stopped due to critical logout failure causing navigation to a browser error page. Candidate user login and dashboard verification succeeded, but logout and subsequent role tests could not proceed. Please fix the logout functionality and network/server issues to continue testing.
Browser Console Logs:
[ERROR] Failed to load resource: net::ERR_EMPTY_RESPONSE (at https://unpkg.com/@splinetool/runtime@1.10.90/build/runtime.js:0:0)
[ERROR] Failed to load resource: net::ERR_EMPTY_RESPONSE (at https://app.spline.design/_assets/_icons/icon_favicon32x32.png:0:0)
[WARNING] Detected `scroll-behavior: smooth` on the `<html>` element. To disable smooth scrolling during route transitions, add `data-scroll-behavior="smooth"` to your <html> element. Learn more: https://nextjs.org/docs/messages/missing-data-scroll-behavior (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_7a8122d0._.js:2287:27)
[ERROR] [v0] AuthPage - useEffect: Client ready, session status: no_session (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_7a8122d0._.js:3117:31)
[ERROR] [v0] AuthPage - useEffect: Client ready, session status: no_session (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_7a8122d0._.js:3117:31)
[ERROR] [v0] Attempting to sign in with email: gaganbhuvan2027@gmail.com (Login flow) (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_7a8122d0._.js:3117:31)
[ERROR] [v0] Sign in response - Error: undefined Data: {user: Object, session: Object} (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_7a8122d0._.js:3117:31)
[ERROR] A tree hydrated but some attributes of the server rendered HTML didn't match the client properties. This won't be patched up. This can happen if a SSR-ed Client Component used:

- A server/client branch `if (typeof window !== 'undefined')`.
- Variable input such as `Date.now()` or `Math.random()` which changes each time it's called.
- Date formatting in a user's locale which doesn't match the server.
- External changing data without sending a snapshot of it along with the HTML.
- Invalid HTML tag nesting.

It can also happen if the client has a browser extension installed which messes with the HTML before React loaded.

%s%s https://react.dev/link/hydration-mismatch 

  ...
    <DashboardNavbar>
      <nav className="fixed top-...">
        <ExitOnPopstateExit>
        <div className="max-w-7xl ...">
          <LinkComponent>
          <div className="hidden md:...">
            <LinkComponent>
            <LinkComponent>
            <LinkComponent>
            <LinkComponent>
            <LinkComponent>
            <JoinInstituteModal triggerClassName="text-gray-...">
              <Dialog open={false} onOpenChange={function bound dispatchSetState}>
                <Dialog data-slot="dialog" open={false} onOpenChange={function bound dispatchSetState}>
                  <DialogProvider scope={undefined} triggerRef={{current:null}} contentRef={{current:null}} ...>
                    <DialogTrigger asChild={true}>
                      <DialogTrigger data-slot="dialog-tri..." asChild={true}>
                        <Primitive.button type="button" aria-haspopup="dialog" aria-expanded={false} ...>
                          <Slot type="button" aria-haspopup="dialog" aria-expanded={false} aria-controls="radix-_R_1..." ...>
                            <SlotClone type="button" aria-haspopup="dialog" aria-expanded={false} ...>
                              <Button variant="ghost" className="text-gray-..." onClick={function} type="button" ...>
                                <button
                                  data-slot="dialog-trigger"
                                  className={"inline-flex items-center justify-center gap-2 whitespace-nowrap rounded..."}
                                  onClick={function}
                                  type="button"
                                  aria-haspopup="dialog"
                                  aria-expanded={false}
+                                 aria-controls="radix-_R_1l9bn5rlb_"
-                                 aria-controls="radix-_R_6kpbn5rlb_"
                                  data-state="closed"
                                  ref={function}
                                >
+                                 Join Institute
                    ...
            ...
              <Slot ref={function}>
                <SlotClone ref={function}>
                  <Primitive.button aria-describedby={undefined} data-state="closed" data-slot="tooltip-tr..." ...>
                    <Slot aria-describedby={undefined} data-state="closed" data-slot="tooltip-tr..." ...>
                      <SlotClone aria-describedby={undefined} data-state="closed" data-slot="tooltip-tr..." ...>
                        <DialogTrigger asChild={true} aria-describedby={undefined} data-state="closed" ...>
                          <DialogTrigger data-slot="tooltip-tr..." asChild={true} aria-describedby={undefined} ...>
                            <Primitive.button type="button" aria-haspopup="dialog" aria-expanded={false} ...>
                              <Slot type="button" aria-haspopup="dialog" aria-expanded={false} ...>
                                <SlotClone type="button" aria-haspopup="dialog" aria-expanded={false} ...>
                                  <button
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue..."
                                    type="button"
                                    aria-haspopup="dialog"
                                    aria-expanded={false}
+                                   aria-controls="radix-_R_1t9bn5rlb_"
-                                   aria-controls="radix-_R_7kpbn5rlb_"
                                    data-state="closed"
                                    data-slot="tooltip-trigger"
                                    aria-describedby={undefined}
                                    onPointerMove={function handleEvent}
                                    onPointerLeave={function handleEvent}
                                    onPointerDown={function handleEvent}
                                    onFocus={function handleEvent}
                                    onBlur={function handleEvent}
                                    onClick={function handleEvent}
                                    ref={function}
                                  >
            ...
              <DropdownMenuTrigger asChild={true}>
                <DropdownMenuTrigger data-slot="dropdown-m..." asChild={true}>
                  <MenuAnchor asChild={true} __scopeMenu={{Menu:[...], ...}}>
                    <PopperAnchor __scopePopper={{Menu:[...], ...}} asChild={true} ref={null}>
                      <Primitive.div asChild={true} ref={function}>
                        <Primitive.div.Slot ref={function}>
                          <Primitive.div.SlotClone ref={function}>
                            <Primitive.button type="button" id="radix-_R_2..." aria-haspopup="menu" aria-expanded={false} ...>
                              <Primitive.button.Slot type="button" id="radix-_R_2..." aria-haspopup="menu" ...>
                                <Primitive.button.SlotClone type="button" id="radix-_R_2..." aria-haspopup="menu" ...>
                                  <button
                                    className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                    type="button"
+                                   id="radix-_R_259bn5rlb_"
-                                   id="radix-_R_8kpbn5rlb_"
                                    aria-haspopup="menu"
                                    aria-expanded={false}
                                    aria-controls={undefined}
                                    data-state="closed"
                                    data-disabled={undefined}
                                    disabled={false}
                                    data-slot="dropdown-menu-trigger"
                                    onPointerDown={function handleEvent}
                                    onKeyDown={function handleEvent}
                                    ref={function}
                                  >
            ...
              <DropdownMenuTrigger asChild={true}>
                <DropdownMenuTrigger data-slot="dropdown-m..." asChild={true}>
                  <MenuAnchor asChild={true} __scopeMenu={{Menu:[...], ...}}>
                    <PopperAnchor __scopePopper={{Menu:[...], ...}} asChild={true} ref={null}>
                      <Primitive.div asChild={true} ref={function}>
                        <Primitive.div.Slot ref={function}>
                          <Primitive.div.SlotClone ref={function}>
                            <Primitive.button type="button" id="radix-_R_2..." aria-haspopup="menu" aria-expanded={false} ...>
                              <Primitive.button.Slot type="button" id="radix-_R_2..." aria-haspopup="menu" ...>
                                <Primitive.button.SlotClone type="button" id="radix-_R_2..." aria-haspopup="menu" ...>
                                  <button
                                    className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                                    type="button"
+                                   id="radix-_R_2d9bn5rlb_"
-                                   id="radix-_R_9kpbn5rlb_"
                                    aria-haspopup="menu"
                                    aria-expanded={false}
                                    aria-controls={undefined}
                                    data-state="closed"
                                    data-disabled={undefined}
                                    disabled={false}
                                    data-slot="dropdown-menu-trigger"
                                    onPointerDown={function handleEvent}
                                    onKeyDown={function handleEvent}
                                    ref={function}
                                  >
          ...
 (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_7a8122d0._.js:3117:31)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/user/scheduled-interviews:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/user/credits:0:0)
[ERROR] CreditsDisplay - fetchCredits: Error in API response: Unauthorized (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_7a8122d0._.js:3117:31)
[WARNING] Detected `scroll-behavior: smooth` on the `<html>` element. To disable smooth scrolling during route transitions, add `data-scroll-behavior="smooth"` to your <html> element. Learn more: https://nextjs.org/docs/messages/missing-data-scroll-behavior (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_7a8122d0._.js:2287:27)
[WARNING] [GroupMarkerNotSet(crbug.com/242999)!:A0043B00141C0000]Automatic fallback to software WebGL has been deprecated. Please use the --enable-unsafe-swiftshader flag to opt in to lower security guarantees for trusted content. (at https://my.spline.design/interactiveaiwebsite-j7qGbx3fJXOPFA20l5QVcZaz/:0:0)
[WARNING] [.WebGL-0x1c1407d3cf00]GL Driver Message (OpenGL, Performance, GL_CLOSE_PATH_NV, High): GPU stall due to ReadPixels (at https://my.spline.design/interactiveaiwebsite-j7qGbx3fJXOPFA20l5QVcZaz/:0:0)
[WARNING] [.WebGL-0x1c1407d3cf00]GL Driver Message (OpenGL, Performance, GL_CLOSE_PATH_NV, High): GPU stall due to ReadPixels (at https://my.spline.design/interactiveaiwebsite-j7qGbx3fJXOPFA20l5QVcZaz/:0:0)
[WARNING] [.WebGL-0x1c1407d3cf00]GL Driver Message (OpenGL, Performance, GL_CLOSE_PATH_NV, High): GPU stall due to ReadPixels (at https://my.spline.design/interactiveaiwebsite-j7qGbx3fJXOPFA20l5QVcZaz/:0:0)
[WARNING] [.WebGL-0x1c1407d3cf00]GL Driver Message (OpenGL, Performance, GL_CLOSE_PATH_NV, High): GPU stall due to ReadPixels (this message will no longer repeat) (at https://my.spline.design/interactiveaiwebsite-j7qGbx3fJXOPFA20l5QVcZaz/:0:0)
[ERROR] [v0] AuthPage - useEffect: Client ready, session status: no_session (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_7a8122d0._.js:3117:31)
[ERROR] [v0] AuthPage - useEffect: Client ready, session status: no_session (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_7a8122d0._.js:3117:31)
[ERROR] [v0] Attempting to sign in with email: admin@example.com (Login flow) (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_7a8122d0._.js:3117:31)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/369d8679-8d09-4aa3-8d6f-fc06d9b2a645/d57230e9-114d-4387-97e7-9a425a8895ed
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC007
- **Test Name:** Credit Management and Enforcement
- **Test Code:** [TC007_Credit_Management_and_Enforcement.py](./TC007_Credit_Management_and_Enforcement.py)
- **Test Error:** The Start Interview button on the interview page does not function as expected. It does not initiate the interview or deduct credits, and the page remains unchanged. Due to this issue, verification of credit display, deduction, and blocking on insufficient credits cannot be completed. Please fix this issue to enable further testing.
Browser Console Logs:
[ERROR] Failed to load resource: net::ERR_EMPTY_RESPONSE (at https://unpkg.com/@splinetool/runtime@1.10.90/build/runtime.js:0:0)
[ERROR] Failed to load resource: net::ERR_EMPTY_RESPONSE (at https://app.spline.design/_assets/_icons/icon_favicon32x32.png:0:0)
[WARNING] Detected `scroll-behavior: smooth` on the `<html>` element. To disable smooth scrolling during route transitions, add `data-scroll-behavior="smooth"` to your <html> element. Learn more: https://nextjs.org/docs/messages/missing-data-scroll-behavior (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_7a8122d0._.js:2287:27)
[ERROR] [v0] AuthPage - useEffect: Client ready, session status: no_session (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_7a8122d0._.js:3117:31)
[ERROR] [v0] AuthPage - useEffect: Client ready, session status: no_session (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_7a8122d0._.js:3117:31)
[ERROR] [v0] Attempting to sign in with email: gaganbhuvan2027@gmail.com (Login flow) (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_7a8122d0._.js:3117:31)
[ERROR] [v0] Sign in response - Error: undefined Data: {user: Object, session: Object} (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_7a8122d0._.js:3117:31)
[ERROR] A tree hydrated but some attributes of the server rendered HTML didn't match the client properties. This won't be patched up. This can happen if a SSR-ed Client Component used:

- A server/client branch `if (typeof window !== 'undefined')`.
- Variable input such as `Date.now()` or `Math.random()` which changes each time it's called.
- Date formatting in a user's locale which doesn't match the server.
- External changing data without sending a snapshot of it along with the HTML.
- Invalid HTML tag nesting.

It can also happen if the client has a browser extension installed which messes with the HTML before React loaded.

%s%s https://react.dev/link/hydration-mismatch 

  ...
    <DashboardNavbar>
      <nav className="fixed top-...">
        <ExitOnPopstateExit>
        <div className="max-w-7xl ...">
          <LinkComponent>
          <div className="hidden md:...">
            <LinkComponent>
            <LinkComponent>
            <LinkComponent>
            <LinkComponent>
            <LinkComponent>
            <JoinInstituteModal triggerClassName="text-gray-...">
              <Dialog open={false} onOpenChange={function bound dispatchSetState}>
                <Dialog data-slot="dialog" open={false} onOpenChange={function bound dispatchSetState}>
                  <DialogProvider scope={undefined} triggerRef={{current:null}} contentRef={{current:null}} ...>
                    <DialogTrigger asChild={true}>
                      <DialogTrigger data-slot="dialog-tri..." asChild={true}>
                        <Primitive.button type="button" aria-haspopup="dialog" aria-expanded={false} ...>
                          <Slot type="button" aria-haspopup="dialog" aria-expanded={false} aria-controls="radix-_R_1..." ...>
                            <SlotClone type="button" aria-haspopup="dialog" aria-expanded={false} ...>
                              <Button variant="ghost" className="text-gray-..." onClick={function} type="button" ...>
                                <button
                                  data-slot="dialog-trigger"
                                  className={"inline-flex items-center justify-center gap-2 whitespace-nowrap rounded..."}
                                  onClick={function}
                                  type="button"
                                  aria-haspopup="dialog"
                                  aria-expanded={false}
+                                 aria-controls="radix-_R_1l9bn5rlb_"
-                                 aria-controls="radix-_R_6kpbn5rlb_"
                                  data-state="closed"
                                  ref={function}
                                >
+                                 Join Institute
                    ...
            ...
              <Slot ref={function}>
                <SlotClone ref={function}>
                  <Primitive.button aria-describedby={undefined} data-state="closed" data-slot="tooltip-tr..." ...>
                    <Slot aria-describedby={undefined} data-state="closed" data-slot="tooltip-tr..." ...>
                      <SlotClone aria-describedby={undefined} data-state="closed" data-slot="tooltip-tr..." ...>
                        <DialogTrigger asChild={true} aria-describedby={undefined} data-state="closed" ...>
                          <DialogTrigger data-slot="tooltip-tr..." asChild={true} aria-describedby={undefined} ...>
                            <Primitive.button type="button" aria-haspopup="dialog" aria-expanded={false} ...>
                              <Slot type="button" aria-haspopup="dialog" aria-expanded={false} ...>
                                <SlotClone type="button" aria-haspopup="dialog" aria-expanded={false} ...>
                                  <button
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue..."
                                    type="button"
                                    aria-haspopup="dialog"
                                    aria-expanded={false}
+                                   aria-controls="radix-_R_1t9bn5rlb_"
-                                   aria-controls="radix-_R_7kpbn5rlb_"
                                    data-state="closed"
                                    data-slot="tooltip-trigger"
                                    aria-describedby={undefined}
                                    onPointerMove={function handleEvent}
                                    onPointerLeave={function handleEvent}
                                    onPointerDown={function handleEvent}
                                    onFocus={function handleEvent}
                                    onBlur={function handleEvent}
                                    onClick={function handleEvent}
                                    ref={function}
                                  >
            ...
              <DropdownMenuTrigger asChild={true}>
                <DropdownMenuTrigger data-slot="dropdown-m..." asChild={true}>
                  <MenuAnchor asChild={true} __scopeMenu={{Menu:[...], ...}}>
                    <PopperAnchor __scopePopper={{Menu:[...], ...}} asChild={true} ref={null}>
                      <Primitive.div asChild={true} ref={function}>
                        <Primitive.div.Slot ref={function}>
                          <Primitive.div.SlotClone ref={function}>
                            <Primitive.button type="button" id="radix-_R_2..." aria-haspopup="menu" aria-expanded={false} ...>
                              <Primitive.button.Slot type="button" id="radix-_R_2..." aria-haspopup="menu" ...>
                                <Primitive.button.SlotClone type="button" id="radix-_R_2..." aria-haspopup="menu" ...>
                                  <button
                                    className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                    type="button"
+                                   id="radix-_R_259bn5rlb_"
-                                   id="radix-_R_8kpbn5rlb_"
                                    aria-haspopup="menu"
                                    aria-expanded={false}
                                    aria-controls={undefined}
                                    data-state="closed"
                                    data-disabled={undefined}
                                    disabled={false}
                                    data-slot="dropdown-menu-trigger"
                                    onPointerDown={function handleEvent}
                                    onKeyDown={function handleEvent}
                                    ref={function}
                                  >
            ...
              <DropdownMenuTrigger asChild={true}>
                <DropdownMenuTrigger data-slot="dropdown-m..." asChild={true}>
                  <MenuAnchor asChild={true} __scopeMenu={{Menu:[...], ...}}>
                    <PopperAnchor __scopePopper={{Menu:[...], ...}} asChild={true} ref={null}>
                      <Primitive.div asChild={true} ref={function}>
                        <Primitive.div.Slot ref={function}>
                          <Primitive.div.SlotClone ref={function}>
                            <Primitive.button type="button" id="radix-_R_2..." aria-haspopup="menu" aria-expanded={false} ...>
                              <Primitive.button.Slot type="button" id="radix-_R_2..." aria-haspopup="menu" ...>
                                <Primitive.button.SlotClone type="button" id="radix-_R_2..." aria-haspopup="menu" ...>
                                  <button
                                    className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                                    type="button"
+                                   id="radix-_R_2d9bn5rlb_"
-                                   id="radix-_R_9kpbn5rlb_"
                                    aria-haspopup="menu"
                                    aria-expanded={false}
                                    aria-controls={undefined}
                                    data-state="closed"
                                    data-disabled={undefined}
                                    disabled={false}
                                    data-slot="dropdown-menu-trigger"
                                    onPointerDown={function handleEvent}
                                    onKeyDown={function handleEvent}
                                    ref={function}
                                  >
          ...
 (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_7a8122d0._.js:3117:31)
[WARNING] Detected `scroll-behavior: smooth` on the `<html>` element. To disable smooth scrolling during route transitions, add `data-scroll-behavior="smooth"` to your <html> element. Learn more: https://nextjs.org/docs/messages/missing-data-scroll-behavior (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_7a8122d0._.js:2287:27)
[ERROR] [v0] Permission check failed: TypeError: Failed to execute 'query' on 'Permissions': Illegal invocation
    at window.navigator.permissions.query (<anonymous>:31:21)
    at AudioVideoInterviewer.useEffect.checkPermissions (http://localhost:3000/_next/static/chunks/_bd515b88._.js:2573:71)
    at AudioVideoInterviewer.useEffect (http://localhost:3000/_next/static/chunks/_bd515b88._.js:2596:13)
    at Object.react_stack_bottom_frame (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:14866:22)
    at runWithFiberInDEV (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:959:74)
    at commitHookEffectListMount (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:7260:167)
    at commitHookPassiveMountEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:7295:60)
    at reconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8780:17)
    at recursivelyTraverseReconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8767:13)
    at reconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8779:17)
    at recursivelyTraverseReconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8767:13)
    at reconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8786:443)
    at recursivelyTraverseReconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8767:13)
    at reconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8794:17)
    at recursivelyTraverseReconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8767:13)
    at reconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8779:17)
    at recursivelyTraverseReconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8767:13)
    at reconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8794:17)
    at recursivelyTraverseReconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8767:13)
    at reconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8794:17)
    at recursivelyTraverseReconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8767:13)
    at reconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8794:17)
    at recursivelyTraverseReconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8767:13)
    at reconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8779:17)
    at recursivelyTraverseReconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8767:13)
    at commitPassiveMountOnFiber (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8739:970)
    at recursivelyTraversePassiveMountEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8677:316)
    at commitPassiveMountOnFiber (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8731:17)
    at recursivelyTraversePassiveMountEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8677:316)
    at commitPassiveMountOnFiber (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8689:17)
    at recursivelyTraversePassiveMountEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8677:316)
    at commitPassiveMountOnFiber (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8689:17)
    at recursivelyTraversePassiveMountEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8677:316)
    at commitPassiveMountOnFiber (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8689:17)
    at recursivelyTraversePassiveMountEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8677:316)
    at commitPassiveMountOnFiber (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8751:17)
    at recursivelyTraversePassiveMountEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8677:316)
    at commitPassiveMountOnFiber (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8751:17)
    at recursivelyTraversePassiveMountEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8677:316)
    at commitPassiveMountOnFiber (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8689:17)
    at recursivelyTraversePassiveMountEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8677:316)
    at commitPassiveMountOnFiber (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8694:17)
    at recursivelyTraversePassiveMountEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8677:316)
    at commitPassiveMountOnFiber (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8689:17)
    at recursivelyTraversePassiveMountEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8677:316)
    at commitPassiveMountOnFiber (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8689:17)
    at recursivelyTraversePassiveMountEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8677:316)
    at commitPassiveMountOnFiber (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8689:17)
    at recursivelyTraversePassiveMountEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8677:316)
    at commitPassiveMountOnFiber (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8689:17) (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_7a8122d0._.js:3117:31)
[ERROR] [v0] Permission check failed: TypeError: Failed to execute 'query' on 'Permissions': Illegal invocation
    at window.navigator.permissions.query (<anonymous>:31:21)
    at AudioVideoInterviewer.useEffect.checkPermissions (http://localhost:3000/_next/static/chunks/_bd515b88._.js:2573:71)
    at AudioVideoInterviewer.useEffect (http://localhost:3000/_next/static/chunks/_bd515b88._.js:2596:13)
    at Object.react_stack_bottom_frame (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:14866:22)
    at runWithFiberInDEV (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:959:74)
    at commitHookEffectListMount (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:7260:167)
    at commitHookPassiveMountEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:7295:60)
    at reconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8780:17)
    at recursivelyTraverseReconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8767:13)
    at reconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8779:17)
    at recursivelyTraverseReconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8767:13)
    at reconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8786:443)
    at recursivelyTraverseReconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8767:13)
    at reconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8794:17)
    at recursivelyTraverseReconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8767:13)
    at reconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8779:17)
    at recursivelyTraverseReconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8767:13)
    at reconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8794:17)
    at recursivelyTraverseReconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8767:13)
    at reconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8794:17)
    at recursivelyTraverseReconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8767:13)
    at reconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8794:17)
    at recursivelyTraverseReconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8767:13)
    at reconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8779:17)
    at recursivelyTraverseReconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8767:13)
    at reconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8786:443)
    at recursivelyTraverseReconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8767:13)
    at reconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8794:17)
    at recursivelyTraverseReconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8767:13)
    at reconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8779:17)
    at recursivelyTraverseReconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8767:13)
    at reconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8779:17)
    at recursivelyTraverseReconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8767:13)
    at reconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8779:17)
    at recursivelyTraverseReconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8767:13)
    at reconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8794:17)
    at recursivelyTraverseReconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8767:13)
    at reconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8794:17)
    at recursivelyTraverseReconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8767:13)
    at reconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8779:17)
    at recursivelyTraverseReconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8767:13)
    at reconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8794:17)
    at recursivelyTraverseReconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8767:13)
    at reconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8779:17)
    at recursivelyTraverseReconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8767:13)
    at reconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8779:17)
    at recursivelyTraverseReconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8767:13)
    at reconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8779:17)
    at recursivelyTraverseReconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8767:13)
    at reconnectPassiveEffects (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:8779:17) (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_7a8122d0._.js:3117:31)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/user/credits:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/user/credits:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/369d8679-8d09-4aa3-8d6f-fc06d9b2a645/c9cafc06-77d3-4501-a9e8-e52495f97587
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC008
- **Test Name:** UI Components Responsiveness and Cross-Browser Compatibility
- **Test Code:** [null](./null)
- **Test Error:** Test execution timed out after 15 minutes
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/369d8679-8d09-4aa3-8d6f-fc06d9b2a645/5af5731c-47d2-466f-bc06-b6b1d32caaa0
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC009
- **Test Name:** Error Handling on Network Failures and API Errors
- **Test Code:** [TC009_Error_Handling_on_Network_Failures_and_API_Errors.py](./TC009_Error_Handling_on_Network_Failures_and_API_Errors.py)
- **Test Error:** Testing stopped due to navigation failure to interview submission page causing browser error. Network failure during login was tested successfully. Unable to proceed with server error simulation during interview submission. Please fix navigation issue to continue testing error handling scenarios.
Browser Console Logs:
[WARNING] [GroupMarkerNotSet(crbug.com/242999)!:A0583B005C030000]Automatic fallback to software WebGL has been deprecated. Please use the --enable-unsafe-swiftshader flag to opt in to lower security guarantees for trusted content. (at https://my.spline.design/interactiveaiwebsite-j7qGbx3fJXOPFA20l5QVcZaz/:0:0)
[WARNING] [.WebGL-0x35c06765380]GL Driver Message (OpenGL, Performance, GL_CLOSE_PATH_NV, High): GPU stall due to ReadPixels (at https://my.spline.design/interactiveaiwebsite-j7qGbx3fJXOPFA20l5QVcZaz/:0:0)
[WARNING] [.WebGL-0x35c06765380]GL Driver Message (OpenGL, Performance, GL_CLOSE_PATH_NV, High): GPU stall due to ReadPixels (at https://my.spline.design/interactiveaiwebsite-j7qGbx3fJXOPFA20l5QVcZaz/:0:0)
[WARNING] [.WebGL-0x35c06765380]GL Driver Message (OpenGL, Performance, GL_CLOSE_PATH_NV, High): GPU stall due to ReadPixels (at https://my.spline.design/interactiveaiwebsite-j7qGbx3fJXOPFA20l5QVcZaz/:0:0)
[WARNING] [.WebGL-0x35c06765380]GL Driver Message (OpenGL, Performance, GL_CLOSE_PATH_NV, High): GPU stall due to ReadPixels (this message will no longer repeat) (at https://my.spline.design/interactiveaiwebsite-j7qGbx3fJXOPFA20l5QVcZaz/:0:0)
[WARNING] Detected `scroll-behavior: smooth` on the `<html>` element. To disable smooth scrolling during route transitions, add `data-scroll-behavior="smooth"` to your <html> element. Learn more: https://nextjs.org/docs/messages/missing-data-scroll-behavior (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_7a8122d0._.js:2287:27)
[ERROR] [v0] AuthPage - useEffect: Client ready, session status: no_session (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_7a8122d0._.js:3117:31)
[ERROR] [v0] AuthPage - useEffect: Client ready, session status: no_session (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_7a8122d0._.js:3117:31)
[ERROR] [v0] Attempting to sign in with email: gaganbhuvan2027@gmail.com (Login flow) (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_7a8122d0._.js:3117:31)
[ERROR] [v0] Sign in response - Error: undefined Data: {user: Object, session: Object} (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_7a8122d0._.js:3117:31)
[WARNING] Detected `scroll-behavior: smooth` on the `<html>` element. To disable smooth scrolling during route transitions, add `data-scroll-behavior="smooth"` to your <html> element. Learn more: https://nextjs.org/docs/messages/missing-data-scroll-behavior (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_7a8122d0._.js:2287:27)
[ERROR] Failed to load resource: net::ERR_EMPTY_RESPONSE (at http://localhost:3000/api/user/scheduled-interviews:0:0)
[ERROR] Error fetching scheduled interviews: TypeError: Failed to fetch
    at fetchScheduledInterviews (http://localhost:3000/_next/static/chunks/_b0c47495._.js:587:36) (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_7a8122d0._.js:3117:31)
[ERROR] Failed to load resource: net::ERR_EMPTY_RESPONSE (at http://localhost:3000/results?interviewId=e2833175-96db-48ed-9497-88d619687dfb&_rsc=1t4w8:0:0)
[ERROR] Failed to fetch RSC payload for http://localhost:3000/results?interviewId=e2833175-96db-48ed-9497-88d619687dfb. Falling back to browser navigation. TypeError: Failed to fetch
    at createFetch (http://localhost:3000/_next/static/chunks/node_modules_next_dist_client_aaee43fe._.js:2552:24)
    at fetchServerResponse (http://localhost:3000/_next/static/chunks/node_modules_next_dist_client_aaee43fe._.js:2456:27)
    at navigateDynamicallyWithNoPrefetch (http://localhost:3000/_next/static/chunks/node_modules_next_dist_client_aaee43fe._.js:7604:90)
    at navigate (http://localhost:3000/_next/static/chunks/node_modules_next_dist_client_aaee43fe._.js:7423:15)
    at navigateReducer (http://localhost:3000/_next/static/chunks/node_modules_next_dist_client_aaee43fe._.js:7899:45)
    at clientReducer (http://localhost:3000/_next/static/chunks/node_modules_next_dist_client_aaee43fe._.js:12245:61)
    at Object.action (http://localhost:3000/_next/static/chunks/node_modules_next_dist_client_aaee43fe._.js:12491:55)
    at runAction (http://localhost:3000/_next/static/chunks/node_modules_next_dist_client_aaee43fe._.js:12396:38)
    at dispatchAction (http://localhost:3000/_next/static/chunks/node_modules_next_dist_client_aaee43fe._.js:12459:9)
    at Object.dispatch (http://localhost:3000/_next/static/chunks/node_modules_next_dist_client_aaee43fe._.js:12489:40)
    at http://localhost:3000/_next/static/chunks/node_modules_next_dist_client_aaee43fe._.js:1442:29
    at startTransition (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:5494:31)
    at dispatch (http://localhost:3000/_next/static/chunks/node_modules_next_dist_client_aaee43fe._.js:1441:13)
    at dispatchAppRouterAction (http://localhost:3000/_next/static/chunks/node_modules_next_dist_client_aaee43fe._.js:1423:5)
    at dispatchNavigateAction (http://localhost:3000/_next/static/chunks/node_modules_next_dist_client_aaee43fe._.js:12543:49)
    at http://localhost:3000/_next/static/chunks/node_modules_next_dist_client_aaee43fe._.js:12610:13
    at startTransition (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_a0e4c7b4._.js:1279:31)
    at Object.push (http://localhost:3000/_next/static/chunks/node_modules_next_dist_client_aaee43fe._.js:12609:36)
    at handleRowClick (http://localhost:3000/_next/static/chunks/_14680e6b._.js:2877:16)
    at onClick (http://localhost:3000/_next/static/chunks/_14680e6b._.js:3004:62)
    at executeDispatch (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:10308:13)
    at runWithFiberInDEV (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:959:74)
    at processDispatchQueue (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:10334:41)
    at http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:10609:13
    at batchedUpdates$1 (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:2247:44)
    at dispatchEventForPluginEventSystem (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:10410:9)
    at dispatchEvent (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:12925:37)
    at dispatchDiscreteEvent (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_1e674e59._.js:12907:64) (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_7a8122d0._.js:3117:31)
[ERROR] Failed to load resource: net::ERR_EMPTY_RESPONSE (at http://localhost:3000/api/user/credits:0:0)
[ERROR] CreditsDisplay - Error fetching credits: TypeError: Failed to fetch
    at fetchCredits (http://localhost:3000/_next/static/chunks/_b0c47495._.js:1385:31) (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_7a8122d0._.js:3117:31)
[ERROR] Failed to load resource: net::ERR_EMPTY_RESPONSE (at http://localhost:3000/__nextjs_original-stack-frames:0:0)
[ERROR] Failed to load resource: net::ERR_EMPTY_RESPONSE (at http://localhost:3000/__nextjs_original-stack-frames:0:0)
[ERROR] WebSocket connection to 'ws://localhost:3000/_next/webpack-hmr?id=HDtyu3QwVpxfLyZd4SEPz' failed: Error in connection establishment: net::ERR_EMPTY_RESPONSE (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_client_aaee43fe._.js:10115:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/369d8679-8d09-4aa3-8d6f-fc06d9b2a645/b8848fbe-bd27-48cb-aa00-eedf4920db72
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---


## 3️⃣ Coverage & Matching Metrics

- **0.00** of tests passed

| Requirement        | Total Tests | ✅ Passed | ❌ Failed  |
|--------------------|-------------|-----------|------------|
| ...                | ...         | ...       | ...        |
---


## 4️⃣ Key Gaps / Risks
{AI_GNERATED_KET_GAPS_AND_RISKS}
---
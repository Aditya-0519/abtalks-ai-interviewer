import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import AppLayout from "../layouts/AppLayout.jsx";
import FeedbackPage from "../pages/FeedbackPage.jsx";
import HomePage from "../pages/HomePage.jsx";
import InterviewPage from "../pages/InterviewPage.jsx";
import NotFoundPage from "../pages/NotFoundPage.jsx";

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />

          <Route
            path="/interview"
            element={<InterviewPage />}
          />

          <Route
            path="/feedback"
            element={<FeedbackPage />}
          />

          <Route
            path="/404"
            element={<NotFoundPage />}
          />

          <Route
            path="*"
            element={<Navigate to="/404" replace />}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
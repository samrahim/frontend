// Global styles to be imported in App or main.tsx
import { css } from "@emotion/react";
import lightTheme from "../theme/theme";

export const globalStyles = css`
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html {
    scroll-behavior: smooth;
  }

  body {
    font-family: ${lightTheme.fonts.body};
    font-size: 16px;
    line-height: ${lightTheme.lineHeights.body};
    color: ${lightTheme.colors.text};
    background-color: ${lightTheme.colors.background};
    transition:
      background-color 0.2s ease,
      color 0.2s ease;
  }

  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    body {
      color: #f3f4f6;
      background-color: #111827;
    }
  }

  a {
    color: ${lightTheme.colors.primary};
    text-decoration: none;
    transition: color 0.2s ease;

    &:hover {
      color: ${lightTheme.colors.primaryDark};
    }
  }

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    font-family: ${lightTheme.fonts.heading};
    font-weight: ${lightTheme.fontWeights.heading};
    line-height: ${lightTheme.lineHeights.heading};
  }

  h1 {
    font-size: 36px;
  }

  h2 {
    font-size: 28px;
  }

  h3 {
    font-size: 24px;
  }

  h4 {
    font-size: 20px;
  }

  h5 {
    font-size: 18px;
  }

  h6 {
    font-size: 16px;
  }

  button {
    font-family: inherit;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    border: none;
    border-radius: 6px;
    padding: 10px 16px;
    background-color: ${lightTheme.colors.primary};
    color: white;
    transition: all 0.2s ease;

    &:hover:not(:disabled) {
      background-color: ${lightTheme.colors.primaryDark};
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.15);
      transform: translateY(-2px);
    }

    &:active:not(:disabled) {
      transform: translateY(0);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  input,
  textarea,
  select {
    font-family: inherit;
    font-size: 1rem;
    padding: 10px 12px;
    border: 1px solid ${lightTheme.colors.border};
    border-radius: 6px;
    background-color: ${lightTheme.colors.background};
    color: ${lightTheme.colors.text};
    transition:
      border-color 0.2s ease,
      box-shadow 0.2s ease;

    &:focus {
      outline: none;
      border-color: ${lightTheme.colors.primary};
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    &::placeholder {
      color: ${lightTheme.colors.subtle};
    }
  }

  /* Modal overlay styles */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    animation: fadeIn 0.2s ease;
  }

  .modal-content {
    background-color: ${lightTheme.colors.background};
    border-radius: 12px;
    padding: 32px;
    max-width: 500px;
    width: 90%;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2);
    animation: slideUp 0.3s ease;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes slideUp {
    from {
      transform: translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  /* Responsive table styles */
  .table-container {
    width: 100%;
    overflow-x: auto;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;

    thead {
      background-color: ${lightTheme.colors.muted};
      font-weight: 600;
    }

    th {
      padding: 12px 16px;
      text-align: left;
      border-bottom: 1px solid ${lightTheme.colors.border};
    }

    td {
      padding: 12px 16px;
      border-bottom: 1px solid ${lightTheme.colors.border};
    }

    tbody tr {
      transition: background-color 0.2s ease;

      &:hover {
        background-color: ${lightTheme.colors.muted};
      }
    }
  }

  /* Mobile responsive */
  @media (max-width: 640px) {
    h1 {
      font-size: 28px;
    }

    h2 {
      font-size: 24px;
    }

    .modal-content {
      padding: 20px;
      max-width: 95vw;
    }

    button {
      width: 100%;
    }

    input,
    textarea,
    select {
      width: 100%;
    }

    table {
      font-size: 12px;

      th,
      td {
        padding: 8px 12px;
      }
    }
  }
`;

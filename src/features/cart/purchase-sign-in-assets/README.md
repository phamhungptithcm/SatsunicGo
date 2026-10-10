# Official Google sign-in assets

Retrieved 2026-10-09. Google trademark use follows https://developers.google.com/identity/branding-guidelines .

- `google-g.png`: unmodified https://developers.google.com/static/identity/images/g-logo.png ; displayed with object-fit:contain to preserve its aspect ratio. This is a Google trademark, not an application-owned logo.
- `google-sans-sign-in-vi.ttf`: unmodified Google Fonts 500-weight subset requested with `text=Đăng nhập với Google` from https://fonts.googleapis.com/css2?family=Google+Sans:wght@500&display=swap . The font is deliberately scoped to that fixed label. Update the subset when changing the label or locale.
- `OFL.txt`: unmodified license from https://raw.githubusercontent.com/googlefonts/googlesans/main/OFL.txt . Keep the license with the font when distributing it.

Both assets are bundled locally through Vite. Rendering this button does not contact Google. The existing authentication handler is unchanged.

# awitijnr.espace.co.ke — Fred Awiti portfolio

Static single-page portfolio. No build step, no dependencies.

## Layout
```
/opt/awitijnr
├── index.html
├── assets/
│   ├── styles.css
│   ├── main.js
│   └── documents/
│       └── fred-awiti-cv.pdf   ← drop your CV PDF here with this exact name
└── README.md
```

## One thing you need to do

Copy your CV PDF to `assets/documents/fred-awiti-cv.pdf`. The Download CV button
already points at that path — rename the file to match, or change the href in
`index.html` if you want a different filename.

## Local preview

```sh
cd /opt/awitijnr && python3 -m http.server 8080
# then visit http://localhost:8080
```

## Nginx deploy for awitijnr.espace.co.ke

Drop this into `/etc/nginx/sites-available/awitijnr.espace.co.ke` (adjust paths
to your existing pattern on the espace.co.ke server):

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name awitijnr.espace.co.ke;

    # certbot will manage the TLS block; run:
    # sudo certbot --nginx -d awitijnr.espace.co.ke

    root /opt/awitijnr;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(css|js|woff2?|svg|png|jpg|jpeg|webp|pdf|ico)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    gzip on;
    gzip_types text/css application/javascript image/svg+xml application/pdf;
}
```

Then:
```sh
sudo ln -s /etc/nginx/sites-available/awitijnr.espace.co.ke /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d awitijnr.espace.co.ke
```

And make sure a DNS A record for `awitijnr.espace.co.ke` points at the espace.co.ke
server IP before running certbot.

## Editing content

All content lives in `index.html`. Projects are simple `<article class="project">`
blocks — copy one, change the text. Skills are `<div class="skill-card">` blocks.
Colors and spacing live in `assets/styles.css` under the `:root` custom properties
at the top.

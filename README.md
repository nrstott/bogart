# Bogart

The official website for [Bogart](https://github.com/nrstott/bogart).  Located at [http://nrstott.github.io/bogart](http://nrstott.github.io/bogart).

# Dependencies

    - Gulp (`npm install -g gulp`)
    - Bower (`npm install -g bower`)
    - Jekyll (`gem install jekyll`)

# Instructions

To build the site:

```bash

npm install
bower install
gulp
jekyll build

```

---

To actively develop:

```bash

gulp
jekyll serve --watch
google-chrome http://localhost:4000

```

---

To package the site for deployment:

```bash

gulp build
jekyll build

```
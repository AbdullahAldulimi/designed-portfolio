{\rtf1\ansi\ansicpg1252\cocoartf2870
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\paperw11900\paperh16840\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx720\tx1440\tx2160\tx2880\tx3600\tx4320\tx5040\tx5760\tx6480\tx7200\tx7920\tx8640\pardirnatural\partightenfactor0

\f0\fs24 \cf0 document.addEventListener("DOMContentLoaded", () => \{\
\
  const intro =\
    document.getElementById("intro");\
\
  const site =\
    document.getElementById("site");\
\
  const pages =\
    document.querySelectorAll(".page");\
\
  const tabButtons =\
    document.querySelectorAll(".tab-button");\
\
  const pageNumber =\
    document.getElementById("pageNumber");\
\
  const pageProgress =\
    document.getElementById("pageProgress");\
\
  const transitionLayer =\
    document.getElementById("transitionLayer");\
\
  const transitionNumber =\
    document.getElementById("transitionNumber");\
\
  const cursorDot =\
    document.getElementById("cursorDot");\
\
  const cursorRing =\
    document.getElementById("cursorRing");\
\
  const cursorGlow =\
    document.getElementById("cursorGlow");\
\
\
  /* =================================================\
     INTRO\
  ================================================= */\
\
  setTimeout(() => \{\
\
    intro.classList.add("hide");\
\
  \}, 1800);\
\
\
  setTimeout(() => \{\
\
    intro.style.display = "none";\
\
  \}, 2800);\
\
\
\
  /* =================================================\
     SPLIT TEXT\
  ================================================= */\
\
  document.querySelectorAll("[data-split]")\
    .forEach(element => \{\
\
      const text =\
        element.textContent.trim();\
\
      element.textContent = "";\
\
\
      [...text].forEach((char, index) => \{\
\
        const span =\
          document.createElement("span");\
\
        span.className = "char";\
\
        span.style.setProperty(\
          "--char-index",\
          index\
        );\
\
        span.textContent =\
          char === " "\
            ? "\\u00A0"\
            : char;\
\
        element.appendChild(span);\
\
      \});\
\
    \});\
\
\
\
  /* =================================================\
     PAGE DATA\
  ================================================= */\
\
  const pageData = \{\
\
    home: \{\
      number: "01",\
      progress: "25%"\
    \},\
\
    work: \{\
      number: "02",\
      progress: "50%"\
    \},\
\
    about: \{\
      number: "03",\
      progress: "75%"\
    \},\
\
    contact: \{\
      number: "04",\
      progress: "100%"\
    \}\
\
  \};\
\
\
  let currentPageName = "home";\
\
  let changing = false;\
\
\
\
  /* =================================================\
     PAGE CHANGE\
  ================================================= */\
\
  function openPage(pageName) \{\
\
    if (\
      changing ||\
      pageName === currentPageName ||\
      !pageData[pageName]\
    ) \{\
      return;\
    \}\
\
\
    changing = true;\
\
\
    transitionNumber.textContent =\
      pageData[pageName].number;\
\
\
    transitionLayer.className =\
      "transition-layer enter";\
\
\
    setTimeout(() => \{\
\
      pages.forEach(page => \{\
\
        page.classList.remove(\
          "active"\
        );\
\
      \});\
\
\
      const selectedPage =\
        document.getElementById(\
          pageName\
        );\
\
\
      if (selectedPage) \{\
\
        selectedPage.classList.add(\
          "active"\
        );\
\
      \}\
\
\
      currentPageName =\
        pageName;\
\
\
      pageNumber.textContent =\
        pageData[\
          pageName\
        ].number;\
\
\
      pageProgress.style.width =\
        pageData[\
          pageName\
        ].progress;\
\
\
      tabButtons.forEach(button => \{\
\
        button.classList.remove(\
          "active-nav"\
        );\
\
\
        if (\
          button.dataset.page ===\
          pageName\
        ) \{\
\
          button.classList.add(\
            "active-nav"\
          );\
\
        \}\
\
      \});\
\
\
      transitionLayer.className =\
        "transition-layer exit";\
\
\
    \}, 650);\
\
\
    setTimeout(() => \{\
\
      transitionLayer.className =\
        "transition-layer";\
\
\
      changing = false;\
\
    \}, 1350);\
\
  \}\
\
\
\
  tabButtons.forEach(button => \{\
\
    button.addEventListener(\
      "click",\
      () => \{\
\
        openPage(\
          button.dataset.page\
        );\
\
      \}\
    );\
\
  \});\
\
\
\
  /* =================================================\
     CURSOR\
  ================================================= */\
\
  let mouseX = 0;\
  let mouseY = 0;\
\
  let ringX = 0;\
  let ringY = 0;\
\
\
  if (\
    window.matchMedia(\
      "(pointer: fine)"\
    ).matches\
  ) \{\
\
    document.body.classList.add(\
      "cursor-active"\
    );\
\
\
    window.addEventListener(\
      "mousemove",\
      event => \{\
\
        mouseX = event.clientX;\
\
        mouseY = event.clientY;\
\
\
        cursorDot.style.transform =\
          `translate(\
            $\{mouseX - 2.5\}px,\
            $\{mouseY - 2.5\}px\
          )`;\
\
      \}\
    );\
\
\
    function animateCursor() \{\
\
      ringX +=\
        (mouseX - ringX) * .14;\
\
\
      ringY +=\
        (mouseY - ringY) * .14;\
\
\
      cursorRing.style.transform =\
        `translate(\
          $\{ringX - 17\}px,\
          $\{ringY - 17\}px\
        )`;\
\
\
      requestAnimationFrame(\
        animateCursor\
      );\
\
    \}\
\
\
    animateCursor();\
\
\
    document.querySelectorAll(\
      "button, a, .project-card, .service-row"\
    )\
    .forEach(element => \{\
\
      element.addEventListener(\
        "mouseenter",\
        () => \{\
\
          document.body.classList.add(\
            "cursor-hover"\
          );\
\
        \}\
      );\
\
\
      element.addEventListener(\
        "mouseleave",\
        () => \{\
\
          document.body.classList.remove(\
            "cursor-hover"\
          );\
\
        \}\
      );\
\
    \});\
\
  \}\
\
\
\
  /* =================================================\
     CURSOR GLOW\
  ================================================= */\
\
  site.addEventListener(\
    "mousemove",\
    event => \{\
\
      const rect =\
        site.getBoundingClientRect();\
\
\
      const x =\
        event.clientX -\
        rect.left;\
\
\
      const y =\
        event.clientY -\
        rect.top;\
\
\
      cursorGlow.style.left =\
        `$\{x\}px`;\
\
\
      cursorGlow.style.top =\
        `$\{y\}px`;\
\
    \}\
  );\
\
\
\
  /* =================================================\
     MAGNETIC BUTTONS\
  ================================================= */\
\
  document.querySelectorAll(\
    ".magnetic"\
  )\
  .forEach(button => \{\
\
    button.addEventListener(\
      "mousemove",\
      event => \{\
\
        const rect =\
          button.getBoundingClientRect();\
\
\
        const x =\
          event.clientX -\
          rect.left -\
          rect.width / 2;\
\
\
        const y =\
          event.clientY -\
          rect.top -\
          rect.height / 2;\
\
\
        button.style.transform =\
          `translate(\
            $\{x * .18\}px,\
            $\{y * .18\}px\
          )`;\
\
      \}\
    );\
\
\
    button.addEventListener(\
      "mouseleave",\
      () => \{\
\
        button.style.transform =\
          "translate(0,0)";\
\
      \}\
    );\
\
  \});\
\
\
\
  /* =================================================\
     PROJECT TILT\
  ================================================= */\
\
  document.querySelectorAll(\
    ".tilt-card"\
  )\
  .forEach(card => \{\
\
    const visual =\
      card.querySelector(\
        ".project-visual"\
      );\
\
\
    card.addEventListener(\
      "mousemove",\
      event => \{\
\
        const rect =\
          card.getBoundingClientRect();\
\
\
        const x =\
          (\
            event.clientX -\
            rect.left\
          ) /\
          rect.width -\
          .5;\
\
\
        const y =\
          (\
            event.clientY -\
            rect.top\
          ) /\
          rect.height -\
          .5;\
\
\
        visual.style.transform =\
          `\
          rotateY($\{x * 10\}deg)\
          rotateX($\{-y * 10\}deg)\
          translateY(-7px)\
          `;\
\
      \}\
    );\
\
\
    card.addEventListener(\
      "mouseleave",\
      () => \{\
\
        visual.style.transform =\
          `\
          rotateY(0deg)\
          rotateX(0deg)\
          translateY(0)\
          `;\
\
      \}\
    );\
\
  \});\
\
\
\
  /* =================================================\
     KEYBOARD NAV\
  ================================================= */\
\
  document.addEventListener(\
    "keydown",\
    event => \{\
\
      if (event.key === "1") \{\
        openPage("home");\
      \}\
\
      if (event.key === "2") \{\
        openPage("work");\
      \}\
\
      if (event.key === "3") \{\
        openPage("about");\
      \}\
\
      if (event.key === "4") \{\
        openPage("contact");\
      \}\
\
    \}\
  );\
\
\});}
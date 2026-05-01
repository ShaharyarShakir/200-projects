const scrollContainer = document.querySelectorAll(".products");

for (const item of scrollContainer) {
    item.addEventListener('wheel', (e) => {
          e.preventDefault();
          item.scrollLeft += e.deltaY;
    })
  }
<template>
  <div ref="anchorRef" class="anchor-container">
    <span v-for="(id, index) in ids" :key="index" :id="id" />
  </div>
</template>

<script>
export default {
  name: 'Anchor',

  props: {
    ids: { type: Array, required: true },
  },

  data() {
    return {
      observer: null,
    };
  },

  computed: {
    hash() {
      return this.$route.hash.replace('#', '');
    },

    anchorRef() {
      return this.$refs?.anchorRef ? this.$refs.anchorRef?.firstChild : null;
    },
  },

  methods: {
    scrollIntoView() {
      this.anchorRef?.scrollIntoView?.();
    },

    intersectionCallback(entries) {
      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
          this.scrollIntoView();
          this.observer.disconnect();
        }
      });
    },
  },

  mounted() {
    if (!this.anchorRef || !this.ids.includes(this.hash)) return;

    this.scrollIntoView();

    this.observer = new IntersectionObserver(this.intersectionCallback, {
      root: null,
      rootMargin: '0px',
      threshold: 0.5,
    });

    this.observer.observe(this.anchorRef);
  },

  destroyed() {
    this.observer?.disconnect?.()
    this.observer = null
  }
};
</script>

<style lang="styl" scoped>
$lineHeight = 1.15rem
$padding = 1rem

.anchor-container {
     position: relative;
     width: 100%;
     height: 100%;
     bottom: 0;
     left: 0;

     & > span {
         padding-top: ($navbarHeight + $lineHeight + $padding );
         position: absolute;
         width: 100%;
         bottom: 0;
         left: 0;
    }
}
</style>

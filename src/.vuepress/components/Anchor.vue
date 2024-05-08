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

  computed: {
    anchorRef() {
      return this.$refs?.anchorRef ? this.$refs.anchorRef?.firstChild : null;
    },
  },

  methods: {
    formatHash(hash) {
      return hash.replace('#', '');
    },

    scrollIntoView() {
      this.anchorRef?.scrollIntoView?.();
    },
  },

  watch: {
    $route(route){
      if (!this.anchorRef || !this.ids.includes(this.formatHash(route.hash))) return;

      this.scrollIntoView()
    }
  },

  mounted() {
    if (!this.anchorRef || !this.ids.includes(this.formatHash(this.$route.hash))) return;


    this.scrollIntoView();
  },
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

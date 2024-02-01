<template>
  <div class="prop-tags">
    <span v-for="(tag, index) in tags" :key="index" :id="tag" />
  </div>
</template>

<script>
export default {
  name: 'PropTags',
  props: {
    tags: { type: Array, required: true, },
  },
};
</script>

<style lang="styl" scoped>
$lineHeight = 1.15rem
$padding = 1rem

.prop-tags {
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

<template>
  <div class="anchor-container">
    <span v-for="(id, index) in ids" :key="index" :id="id" />
  </div>
</template>

<script>
export default {
  name: 'Anchor',
  props: {
    ids: { type: Array, required: true, },
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

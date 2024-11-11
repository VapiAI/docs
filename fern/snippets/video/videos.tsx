export const YouTubeEmbed = ({ videoUrl, altTitle }) => {

return <Frame>

  <div class="video-embed-wrapper">
    <iframe
      src={videoUrl}
      title={`An embedded YouTube video titled \"${altTitle}\"`}
      frameborder="0"
      allow="fullscreen; accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowfullscreen
      referrerpolicy="strict-origin-when-cross-origin"
    />
  </div>
</Frame>
};

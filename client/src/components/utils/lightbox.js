import React, { Component } from 'react';
import Lightbox from 'react-images';
class ImageLightbox extends Component {
  state = {
    lightboxIsOpen: true,
    currentImage: this.props.pos,
    images: []
  };

  /* The 'Lightbox' Component of the 'react-images' package NEEDS to receive the images in the following STRUCTURE,
  'images={[{ src: 'http://example.com/img1.jpg' }, { src: 'http://example.com/img2.jpg' }]}', so with this 'src'
  PROPERTY, so because the images we're receiving through PROPS from the 'prodimg' Component contains ONLY the 'url'
  we NEEDED a way to TRANSFORM that data, and THIS is exactly what we're doing here below */
  static getDerivedStateFromProps(props, state) {
    if (props.images) {
      const images = [];
      props.images.forEach(element => {
        images.push({ src: `${element}` });
      });
      return (state = {
        images
      });
    }
    return false;
  }

  closeLightbox = () => {
    this.props.onclose();
  };

  gotoPrevious = () => {
    this.setState({
      currentImage: this.state.currentImage - 1
    });
  };

  gotoNext = () => {
    this.setState({
      currentImage: this.state.currentImage + 1
    });
  };

  render() {
    // ALL the properties we're passing to this 'Lightbox' Component can be found on the DOCUMENTATION page(github)
    return (
      <Lightbox
        currentImage={this.state.currentImage}
        images={this.state.images}
        isOpen={this.state.lightboxIsOpen}
        onClickPrev={() => this.gotoPrevious()}
        onClickNext={() => this.gotoNext()}
        onClose={() => this.closeLightbox()}
      />
    );
  }
}

export default ImageLightbox;

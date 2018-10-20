import React, { Component } from 'react';
import { connect } from 'react-redux';

import HomeSlider from './home_slider';
import HomePromotion from './home_promotion';
import CardBlock from '../utils/card_block';
import {
  getProductsBySell,
  getProductsByArrival
} from '../../store/actions/products_actions';

class Home extends Component {
  componentDidMount() {
    this.props.dispatch(getProductsBySell());
    this.props.dispatch(getProductsByArrival());
  }

  render() {
    return (
      <div>
        <HomeSlider />
        <CardBlock
          list={this.props.products.bySell}
          title="Best Selling guitars"
        />
        <HomePromotion />
        <CardBlock list={this.props.products.byArrival} title="New arrivals" />
      </div>
    );
  }
}

const mapStateToProps = state => {
  return {
    /* The name we pass here, 'products' in our case must be exactly the SAME name we use inside the 'index.js' file
    ofthe 'reducers' folder where we COMBINE our reducers, and there we named it 'products' so the name here must be
    the SAME */
    products: state.products
  };
};

export default connect(mapStateToProps)(Home);

import React, { Component } from 'react';
import { connect } from 'react-redux';

import PageTop from '../utils/page_top';
import ProdNfo from './prodNfo';
import ProdImg from './prodimg';
import {
  getProductDetail,
  clearProductDetail
} from '../../store/actions/products_actions';
import { addToCart } from '../../store/actions/user_action';

class ProductPage extends Component {
  componentDidMount() {
    /* When we visit the '/product_detail/:id' Route(that renders THIS 'ProductPage' Component) we have the 'id'
    DIRECTLY inside the URL, so we can catch it from there by accessing the 'match' Object of 'react-router-dom' */
    const id = this.props.match.params.id;
    this.props.dispatch(getProductDetail(id)).then(response => {
      if (!this.props.products.prodDetail) {
        this.props.history.push('/');
      }
    });
  }

  componentWillUnmount() {
    this.props.dispatch(clearProductDetail());
  }

  addToCartHandler(id) {
    this.props.dispatch(addToCart(id));
  }

  render() {
    return (
      <div>
        <PageTop title="Product detail" />
        <div className="container">
          {this.props.products.prodDetail ? (
            <div className="product_detail_wrapper">
              <div className="left">
                <div style={{ width: '500px' }}>
                  <ProdImg detail={this.props.products.prodDetail} />
                </div>
              </div>
              <div className="right">
                {/* The 'id' we're passing to the 'addToCartHandler' is coming from the CHILD Component, so from the
                'ProdNfo' Component ITSELF */}
                <ProdNfo
                  addToCart={id => this.addToCartHandler(id)}
                  detail={this.props.products.prodDetail}
                />
              </div>
            </div>
          ) : (
            'Loading'
          )}
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => {
  return {
    products: state.products
  };
};

export default connect(mapStateToProps)(ProductPage);

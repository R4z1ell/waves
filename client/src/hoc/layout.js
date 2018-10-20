import React, { Component } from 'react';
import { connect } from 'react-redux';
import { getSiteData } from '../store/actions/site_actions';

import Header from '../components/Header_footer/Header';
import Footer from '../components/Header_footer/Footer';

class Layout extends Component {
  componentDidMount() {
    /* At the beginning the 'this.props.site' in our state is by DEFAULT equal to an EMPTY Object(of course we defined
    that inside the 'site_reducer.js' file with the code 'state = {}' as the first argument of the function). An this
    'site' will ONLY be filled with data when we DISPATCH the 'getSiteData' action. So when we FIRST load our app the
    'this.props.site' will be EMPTY and the 'dispatch' will be EXECUTED */
    if (Object.keys(this.props.site).length === 0) {
      this.props.dispatch(getSiteData());
    }
  }

  render() {
    return (
      <div>
        <Header />
        <div className="page_container">{this.props.children}</div>
        <Footer data={this.props.site} />
      </div>
    );
  }
}

const mapStateToProps = state => {
  return {
    site: state.site
  };
};

export default connect(mapStateToProps)(Layout);

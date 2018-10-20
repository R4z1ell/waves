import React, { Component } from 'react';
import { connect } from 'react-redux';
import { auth } from '../store/actions/user_action';
import CircularProgress from '@material-ui/core/CircularProgress';

export default function(ComposedClass, reload, adminRoute = null) {
  class AuthenticationCheck extends Component {
    state = {
      loading: true
    };

    componentDidMount() {
      this.props.dispatch(auth()).then(response => {
        /* As we can see here we're NOT using the 'response' to retrieve our data BUT we're accessing them DIRECTLY 
        from the 'props' we get from the 'mapStateToProps' because by the time we reach this 'componentDidMount' 
        function the DISPATCH has already INJECTED the 'user.userData' INSIDE the 'props' */
        let user = this.props.user.userData;

        if (!user.isAuth) {
          /* 'reload'(that is the SECOND argument that we accept in this function) can be equal to 'true', 'false' 
            OR 'null' */
          if (reload) {
            this.props.history.push('/register_login');
          }
        } else {
          if (adminRoute && !user.isAdmin) {
            this.props.history.push('/user/dashboard');
          } else {
            if (reload === false) {
              this.props.history.push('/user/dashboard');
            }
          }
        }

        this.setState({
          loading: false
        });
      });
    }

    render() {
      if (this.state.loading) {
        return (
          <div className="main_loader">
            <CircularProgress style={{ color: '#2196f3' }} thickness={7} />
          </div>
        );
      }
      /* with 'this.props.user' we're refering to the 'user' property we return from the 'mapStateToProps' below.
      In this we can pretty much pass the data inside 'this.props.user' to EACH Component that gets rendered from
      the 'Route' Component inside the 'routes.js' file */
      return <ComposedClass {...this.props} user={this.props.user} />;
    }
  }

  function mapStateToProps(state) {
    return {
      user: state.user
    };
  }

  return connect(mapStateToProps)(AuthenticationCheck);
}

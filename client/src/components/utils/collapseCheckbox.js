import React, { Component } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAngleDown, faAngleUp } from '@fortawesome/free-solid-svg-icons';

import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import ListItemText from '@material-ui/core/ListItemText';
import Checkbox from '@material-ui/core/Checkbox';
import Collapse from '@material-ui/core/Collapse';

class CollapseCheckbox extends Component {
  state = {
    open: false,
    checked: []
  };

  componentDidMount() {
    if (this.props.initState) {
      this.setState({
        open: this.props.initState
      });
    }
  }

  handleClick = () => {
    this.setState({ open: !this.state.open });
  };

  handleAngle = () =>
    this.state.open ? (
      <FontAwesomeIcon icon={faAngleUp} className="icon" />
    ) : (
      <FontAwesomeIcon icon={faAngleDown} className="icon" />
    );

  renderList = () =>
    this.props.list
      ? this.props.list.map(value => (
          <ListItem key={value._id} style={{ padding: '10px 0' }}>
            <ListItemText primary={value.name} />
            <ListItemSecondaryAction>
              <Checkbox
                color="primary"
                onChange={this.handleToggle(value._id)}
                checked={this.state.checked.indexOf(value._id) !== -1}
              />
            </ListItemSecondaryAction>
          </ListItem>
        ))
      : null;

  handleToggle = value => () => {
    /* We're using DESTRUCTURING, this code below is the same as 'const checked = this.state.checked'. So what
    we're doing is just creating a 'checked' const that STORE the value of 'this.state.checked' */
    const { checked } = this.state;
    const currentIndex = checked.indexOf(value);
    // Here we're creating a COPY ot the 'this.state.checked' Array so that we DON'T mutate the initial 'state'
    const newChecked = [...checked];

    /* IF the result of 'currentIndex' is EQUAL to -1 means that INSIDE the 'checked' Array there ISN'T an element
    that matches the 'value' we passed to it(that is the '_id' pretty much) */
    if (currentIndex === -1) {
      newChecked.push(value);
    } else {
      newChecked.splice(currentIndex, 1);
    }

    /* As second argument to 'setState' we're passing a CALLBACK to pass the 'newChecked' ARRAY to the 'handleFilters'
    PROP that this 'CollapseCheckbox' Component is expecting to receive in the 'index.js' file we've inside the 
     '/components/shop' FOLDER */
    this.setState(
      {
        checked: newChecked
      },
      () => {
        this.props.handleFilters(newChecked);
      }
    );
  };

  render() {
    return (
      <div className="collapse_items_wrapper">
        <List style={{ borderBottom: '1px solid #dbdbdb' }}>
          <ListItem
            onClick={this.handleClick}
            style={{ padding: '10px 23px 10px 0' }}
          >
            <ListItemText
              primary={this.props.title}
              className="collapse_title"
            />
            {this.handleAngle()}
          </ListItem>
          <Collapse in={this.state.open} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {this.renderList()}
            </List>
          </Collapse>
        </List>
      </div>
    );
  }
}

export default CollapseCheckbox;

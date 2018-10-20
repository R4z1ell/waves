import axios from 'axios';

import { USER_SERVER, PRODUCT_SERVER } from '../../components/utils/misc';
import {
  LOGIN_USER,
  REGISTER_USER,
  AUTH_USER,
  LOGOUT_USER,
  ADD_TO_CART_USER,
  GET_CART_ITEMS_USER,
  REMOVE_CART_ITEM_USER,
  ON_SUCCESS_BUY_USER,
  UPDATE_DATA_USER,
  CLEAR_UPDATE_USER_DATA
} from './types';

export function registerUser(dataToSubmit) {
  const request = axios
    .post(`${USER_SERVER}/register`, dataToSubmit)
    .then(response => response.data);

  // With 'redux' we ALWAYS have to return a 'type' and a 'payload'
  return {
    type: REGISTER_USER,
    payload: request
  };
}

export function loginUser(dataToSubmit) {
  const request = axios
    .post(`${USER_SERVER}/login`, dataToSubmit)
    .then(response => response.data);

  return {
    type: LOGIN_USER,
    payload: request
  };
}

export function auth() {
  const request = axios
    .get(`${USER_SERVER}/auth`)
    .then(response => response.data);

  return {
    type: AUTH_USER,
    payload: request
  };
}

export function logoutUser() {
  const request = axios
    .get(`${USER_SERVER}/logout`)
    .then(response => response.data);

  return {
    type: LOGOUT_USER,
    payload: request
  };
}

export function addToCart(_id) {
  const request = axios
    .post(`${USER_SERVER}/addToCart?productId=${_id}`)
    .then(response => response.data);

  return {
    type: ADD_TO_CART_USER,
    payload: request
  };
}

export function getCartItems(cartItems, userCart) {
  const request = axios
    .get(`${PRODUCT_SERVER}/articles_by_id?id=${cartItems}&type=array`)
    .then(response => {
      /* Here below we're looping over the 'userCart' and for EACH element of we're going to loop over ALL the 
      elements inside the 'response.data' and CHECK if the 'item.id === k._id', so if the value of the 'id' property
      of the elements INSIDE the 'userCart' Array have a MATCH with the '_id' inside the 'response.data'. IF we found
      a match THEN we're going to create a new 'quantity' property INSIDE the 'response.data' that has the SAME value
      of the 'quantity' property INSIDE the 'userCart'. So in the end we'll get the SAME response we normally get
      from the '/api/product/articles_by_id' end-point BUT we the addition of a new 'quantity' property */
      userCart.forEach(item => {
        response.data.forEach((k, i) => {
          if (item.id === k._id) {
            response.data[i].quantity = item.quantity;
          }
        });
      });
      return response.data;
    });

  return {
    type: GET_CART_ITEMS_USER,
    payload: request
  };
}

export function removeCartItem(id) {
  const request = axios
    .get(`${USER_SERVER}/removeFromCart?_id=${id}`)
    .then(response => {
      response.data.cart.forEach(item => {
        response.data.cartDetail.forEach((k, i) => {
          if (item.id === k._id) {
            response.data.cartDetail[i].quantity = item.quantity;
          }
        });
      });
      return response.data;
    });

  return {
    type: REMOVE_CART_ITEM_USER,
    payload: request
  };
}

export function onSuccessBuy(data) {
  const request = axios
    .post(`${USER_SERVER}/successBuy`, data)
    .then(response => response.data);

  return {
    type: ON_SUCCESS_BUY_USER,
    payload: request
  };
}

export function updateUserData(dataToSubmit) {
  const request = axios
    .post(`${USER_SERVER}/update_profile`, dataToSubmit)
    .then(response => response.data);

  return {
    type: UPDATE_DATA_USER,
    payload: request
  };
}

export function clearUpdateUser() {
  return {
    type: CLEAR_UPDATE_USER_DATA,
    payload: ''
  };
}

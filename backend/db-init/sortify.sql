PGDMP  5                    }           sortify    17.4    17.4 D               0    0    ENCODING    ENCODING        SET client_encoding = 'UTF8';
                           false                       0    0 
   STDSTRINGS 
   STDSTRINGS     (   SET standard_conforming_strings = 'on';
                           false                       0    0 
   SEARCHPATH 
   SEARCHPATH     8   SELECT pg_catalog.set_config('search_path', '', false);
                           false                       1262    16526    sortify    DATABASE     m   CREATE DATABASE sortify WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'hu-HU';
    DROP DATABASE sortify;
                     postgres    false            \           1247    16528    invitation_status_enum    TYPE     e   CREATE TYPE public.invitation_status_enum AS ENUM (
    'pending',
    'accepted',
    'declined'
);
 )   DROP TYPE public.invitation_status_enum;
       public               postgres    false            _           1247    16536 	   role_enum    TYPE     _   CREATE TYPE public.role_enum AS ENUM (
    'reader',
    'editor',
    'admin',
    'owner'
);
    DROP TYPE public.role_enum;
       public               postgres    false            �            1255    16545    get_user_projects(integer)    FUNCTION     �  CREATE FUNCTION public.get_user_projects(user_id_param integer) RETURNS TABLE(project_name text, role text, created_date timestamp without time zone, creator_name text, has_latest boolean)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.name::TEXT AS project_name,
        up.role::TEXT AS role,
        p.created_date::TIMESTAMP WITHOUT TIME ZONE AS created_date,
        COALESCE(u.full_name, 'Unknown')::TEXT AS creator_name,
        NOT EXISTS (
            SELECT 1
            FROM file_version fv
            JOIN file_data fd ON fv.file_id = fd.file_data_id
            LEFT JOIN last_download ld
                ON fv.file_id = ld.file_id AND ld.user_id = up.user_id
            WHERE fd.project_id = p.project_id
            AND (fv.last_version = TRUE OR fv.version_id = (SELECT MAX(version_id) FROM file_version WHERE file_id = fv.file_id))
            AND (ld.version_id IS NULL OR ld.version_id < fv.version_id)
        ) AS has_latest
    FROM user_project up
    JOIN project p ON up.project_id = p.project_id
    LEFT JOIN user_profile u ON p.creator_id = u.user_id
    WHERE up.user_id = user_id_param;
END;
$$;
 ?   DROP FUNCTION public.get_user_projects(user_id_param integer);
       public               postgres    false            �            1259    16546    alembic_version    TABLE     X   CREATE TABLE public.alembic_version (
    version_num character varying(32) NOT NULL
);
 #   DROP TABLE public.alembic_version;
       public         heap r       postgres    false            �            1259    16549 	   file_data    TABLE     �   CREATE TABLE public.file_data (
    file_data_id integer NOT NULL,
    description text,
    short_comment character varying(20),
    project_id integer
);
    DROP TABLE public.file_data;
       public         heap r       postgres    false            �            1259    16554    file_data_file_data_id_seq    SEQUENCE     �   CREATE SEQUENCE public.file_data_file_data_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 1   DROP SEQUENCE public.file_data_file_data_id_seq;
       public               postgres    false    218                       0    0    file_data_file_data_id_seq    SEQUENCE OWNED BY     Y   ALTER SEQUENCE public.file_data_file_data_id_seq OWNED BY public.file_data.file_data_id;
          public               postgres    false    219            �            1259    16555    file_version    TABLE     q  CREATE TABLE public.file_version (
    version_id integer NOT NULL,
    version_number integer,
    file_name character varying(255),
    file_type character varying(50),
    file_size integer,
    description text,
    last_version boolean,
    short_comment character varying(20),
    upload_date timestamp with time zone,
    file_id integer,
    user_id integer
);
     DROP TABLE public.file_version;
       public         heap r       postgres    false            �            1259    16560    file_version_version_id_seq    SEQUENCE     �   CREATE SEQUENCE public.file_version_version_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 2   DROP SEQUENCE public.file_version_version_id_seq;
       public               postgres    false    220                       0    0    file_version_version_id_seq    SEQUENCE OWNED BY     [   ALTER SEQUENCE public.file_version_version_id_seq OWNED BY public.file_version.version_id;
          public               postgres    false    221            �            1259    16561 
   invitation    TABLE       CREATE TABLE public.invitation (
    invitation_id integer NOT NULL,
    invited_email character varying(255),
    invite_date timestamp with time zone,
    status public.invitation_status_enum,
    invited_user_id integer,
    referrer_id integer,
    project_id integer
);
    DROP TABLE public.invitation;
       public         heap r       postgres    false    860            �            1259    16564    invitation_invitation_id_seq    SEQUENCE     �   CREATE SEQUENCE public.invitation_invitation_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 3   DROP SEQUENCE public.invitation_invitation_id_seq;
       public               postgres    false    222                       0    0    invitation_invitation_id_seq    SEQUENCE OWNED BY     ]   ALTER SEQUENCE public.invitation_invitation_id_seq OWNED BY public.invitation.invitation_id;
          public               postgres    false    223            �            1259    16565    last_download    TABLE     �   CREATE TABLE public.last_download (
    last_download_id integer NOT NULL,
    download_date timestamp with time zone,
    file_id integer,
    user_id integer,
    version_id integer
);
 !   DROP TABLE public.last_download;
       public         heap r       postgres    false            �            1259    16568 "   last_download_last_download_id_seq    SEQUENCE     �   CREATE SEQUENCE public.last_download_last_download_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 9   DROP SEQUENCE public.last_download_last_download_id_seq;
       public               postgres    false    224                       0    0 "   last_download_last_download_id_seq    SEQUENCE OWNED BY     i   ALTER SEQUENCE public.last_download_last_download_id_seq OWNED BY public.last_download.last_download_id;
          public               postgres    false    225            �            1259    16569    project    TABLE     �   CREATE TABLE public.project (
    project_id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    created_date timestamp with time zone,
    project_activity_status boolean,
    creator_id integer
);
    DROP TABLE public.project;
       public         heap r       postgres    false            �            1259    16574    project_project_id_seq    SEQUENCE     �   CREATE SEQUENCE public.project_project_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 -   DROP SEQUENCE public.project_project_id_seq;
       public               postgres    false    226                       0    0    project_project_id_seq    SEQUENCE OWNED BY     Q   ALTER SEQUENCE public.project_project_id_seq OWNED BY public.project.project_id;
          public               postgres    false    227            �            1259    16575    user_profile    TABLE     �  CREATE TABLE public.user_profile (
    user_id integer NOT NULL,
    full_name character varying(255),
    nickname character varying(100),
    profile_pic character varying(255),
    email character varying(150),
    password character varying(150),
    mobile character varying(20),
    job character varying(100),
    created_date timestamp with time zone,
    user_activity_status boolean
);
     DROP TABLE public.user_profile;
       public         heap r       postgres    false            �            1259    16580    user_profile_user_id_seq    SEQUENCE     �   CREATE SEQUENCE public.user_profile_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 /   DROP SEQUENCE public.user_profile_user_id_seq;
       public               postgres    false    228                       0    0    user_profile_user_id_seq    SEQUENCE OWNED BY     U   ALTER SEQUENCE public.user_profile_user_id_seq OWNED BY public.user_profile.user_id;
          public               postgres    false    229            �            1259    16581    user_project    TABLE     �   CREATE TABLE public.user_project (
    user_id integer NOT NULL,
    project_id integer NOT NULL,
    role public.role_enum,
    connection_date timestamp with time zone,
    user_deleted_or_left_date timestamp with time zone
);
     DROP TABLE public.user_project;
       public         heap r       postgres    false    863            I           2604    16584    file_data file_data_id    DEFAULT     �   ALTER TABLE ONLY public.file_data ALTER COLUMN file_data_id SET DEFAULT nextval('public.file_data_file_data_id_seq'::regclass);
 E   ALTER TABLE public.file_data ALTER COLUMN file_data_id DROP DEFAULT;
       public               postgres    false    219    218            J           2604    16585    file_version version_id    DEFAULT     �   ALTER TABLE ONLY public.file_version ALTER COLUMN version_id SET DEFAULT nextval('public.file_version_version_id_seq'::regclass);
 F   ALTER TABLE public.file_version ALTER COLUMN version_id DROP DEFAULT;
       public               postgres    false    221    220            K           2604    16586    invitation invitation_id    DEFAULT     �   ALTER TABLE ONLY public.invitation ALTER COLUMN invitation_id SET DEFAULT nextval('public.invitation_invitation_id_seq'::regclass);
 G   ALTER TABLE public.invitation ALTER COLUMN invitation_id DROP DEFAULT;
       public               postgres    false    223    222            L           2604    16587    last_download last_download_id    DEFAULT     �   ALTER TABLE ONLY public.last_download ALTER COLUMN last_download_id SET DEFAULT nextval('public.last_download_last_download_id_seq'::regclass);
 M   ALTER TABLE public.last_download ALTER COLUMN last_download_id DROP DEFAULT;
       public               postgres    false    225    224            M           2604    16588    project project_id    DEFAULT     x   ALTER TABLE ONLY public.project ALTER COLUMN project_id SET DEFAULT nextval('public.project_project_id_seq'::regclass);
 A   ALTER TABLE public.project ALTER COLUMN project_id DROP DEFAULT;
       public               postgres    false    227    226            N           2604    16589    user_profile user_id    DEFAULT     |   ALTER TABLE ONLY public.user_profile ALTER COLUMN user_id SET DEFAULT nextval('public.user_profile_user_id_seq'::regclass);
 C   ALTER TABLE public.user_profile ALTER COLUMN user_id DROP DEFAULT;
       public               postgres    false    229    228            �          0    16546    alembic_version 
   TABLE DATA           6   COPY public.alembic_version (version_num) FROM stdin;
    public               postgres    false    217   �\       �          0    16549 	   file_data 
   TABLE DATA           Y   COPY public.file_data (file_data_id, description, short_comment, project_id) FROM stdin;
    public               postgres    false    218   �\                 0    16555    file_version 
   TABLE DATA           �   COPY public.file_version (version_id, version_number, file_name, file_type, file_size, description, last_version, short_comment, upload_date, file_id, user_id) FROM stdin;
    public               postgres    false    220   +]                 0    16561 
   invitation 
   TABLE DATA           �   COPY public.invitation (invitation_id, invited_email, invite_date, status, invited_user_id, referrer_id, project_id) FROM stdin;
    public               postgres    false    222   �]                 0    16565    last_download 
   TABLE DATA           f   COPY public.last_download (last_download_id, download_date, file_id, user_id, version_id) FROM stdin;
    public               postgres    false    224   j^                 0    16569    project 
   TABLE DATA           s   COPY public.project (project_id, name, description, created_date, project_activity_status, creator_id) FROM stdin;
    public               postgres    false    226   �^       	          0    16575    user_profile 
   TABLE DATA           �   COPY public.user_profile (user_id, full_name, nickname, profile_pic, email, password, mobile, job, created_date, user_activity_status) FROM stdin;
    public               postgres    false    228   H`                 0    16581    user_project 
   TABLE DATA           m   COPY public.user_project (user_id, project_id, role, connection_date, user_deleted_or_left_date) FROM stdin;
    public               postgres    false    230   Ce                  0    0    file_data_file_data_id_seq    SEQUENCE SET     H   SELECT pg_catalog.setval('public.file_data_file_data_id_seq', 8, true);
          public               postgres    false    219                       0    0    file_version_version_id_seq    SEQUENCE SET     J   SELECT pg_catalog.setval('public.file_version_version_id_seq', 10, true);
          public               postgres    false    221                       0    0    invitation_invitation_id_seq    SEQUENCE SET     K   SELECT pg_catalog.setval('public.invitation_invitation_id_seq', 12, true);
          public               postgres    false    223                       0    0 "   last_download_last_download_id_seq    SEQUENCE SET     P   SELECT pg_catalog.setval('public.last_download_last_download_id_seq', 8, true);
          public               postgres    false    225                       0    0    project_project_id_seq    SEQUENCE SET     E   SELECT pg_catalog.setval('public.project_project_id_seq', 15, true);
          public               postgres    false    227                       0    0    user_profile_user_id_seq    SEQUENCE SET     G   SELECT pg_catalog.setval('public.user_profile_user_id_seq', 16, true);
          public               postgres    false    229            P           2606    16591 #   alembic_version alembic_version_pkc 
   CONSTRAINT     j   ALTER TABLE ONLY public.alembic_version
    ADD CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num);
 M   ALTER TABLE ONLY public.alembic_version DROP CONSTRAINT alembic_version_pkc;
       public                 postgres    false    217            R           2606    16593    file_data file_data_pkey 
   CONSTRAINT     `   ALTER TABLE ONLY public.file_data
    ADD CONSTRAINT file_data_pkey PRIMARY KEY (file_data_id);
 B   ALTER TABLE ONLY public.file_data DROP CONSTRAINT file_data_pkey;
       public                 postgres    false    218            T           2606    16595    file_version file_version_pkey 
   CONSTRAINT     d   ALTER TABLE ONLY public.file_version
    ADD CONSTRAINT file_version_pkey PRIMARY KEY (version_id);
 H   ALTER TABLE ONLY public.file_version DROP CONSTRAINT file_version_pkey;
       public                 postgres    false    220            V           2606    16597    invitation invitation_pkey 
   CONSTRAINT     c   ALTER TABLE ONLY public.invitation
    ADD CONSTRAINT invitation_pkey PRIMARY KEY (invitation_id);
 D   ALTER TABLE ONLY public.invitation DROP CONSTRAINT invitation_pkey;
       public                 postgres    false    222            X           2606    16599     last_download last_download_pkey 
   CONSTRAINT     l   ALTER TABLE ONLY public.last_download
    ADD CONSTRAINT last_download_pkey PRIMARY KEY (last_download_id);
 J   ALTER TABLE ONLY public.last_download DROP CONSTRAINT last_download_pkey;
       public                 postgres    false    224            Z           2606    16601    project project_pkey 
   CONSTRAINT     Z   ALTER TABLE ONLY public.project
    ADD CONSTRAINT project_pkey PRIMARY KEY (project_id);
 >   ALTER TABLE ONLY public.project DROP CONSTRAINT project_pkey;
       public                 postgres    false    226            \           2606    16603 #   user_profile user_profile_email_key 
   CONSTRAINT     _   ALTER TABLE ONLY public.user_profile
    ADD CONSTRAINT user_profile_email_key UNIQUE (email);
 M   ALTER TABLE ONLY public.user_profile DROP CONSTRAINT user_profile_email_key;
       public                 postgres    false    228            ^           2606    16605    user_profile user_profile_pkey 
   CONSTRAINT     a   ALTER TABLE ONLY public.user_profile
    ADD CONSTRAINT user_profile_pkey PRIMARY KEY (user_id);
 H   ALTER TABLE ONLY public.user_profile DROP CONSTRAINT user_profile_pkey;
       public                 postgres    false    228            `           2606    16607    user_project user_project_pkey 
   CONSTRAINT     m   ALTER TABLE ONLY public.user_project
    ADD CONSTRAINT user_project_pkey PRIMARY KEY (user_id, project_id);
 H   ALTER TABLE ONLY public.user_project DROP CONSTRAINT user_project_pkey;
       public                 postgres    false    230    230            a           2606    16608 #   file_data file_data_project_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.file_data
    ADD CONSTRAINT file_data_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.project(project_id);
 M   ALTER TABLE ONLY public.file_data DROP CONSTRAINT file_data_project_id_fkey;
       public               postgres    false    226    218    4698            b           2606    16613 &   file_version file_version_file_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.file_version
    ADD CONSTRAINT file_version_file_id_fkey FOREIGN KEY (file_id) REFERENCES public.file_data(file_data_id);
 P   ALTER TABLE ONLY public.file_version DROP CONSTRAINT file_version_file_id_fkey;
       public               postgres    false    220    4690    218            c           2606    16618 &   file_version file_version_user_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.file_version
    ADD CONSTRAINT file_version_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profile(user_id);
 P   ALTER TABLE ONLY public.file_version DROP CONSTRAINT file_version_user_id_fkey;
       public               postgres    false    220    228    4702            d           2606    16623 *   invitation invitation_invited_user_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.invitation
    ADD CONSTRAINT invitation_invited_user_id_fkey FOREIGN KEY (invited_user_id) REFERENCES public.user_profile(user_id);
 T   ALTER TABLE ONLY public.invitation DROP CONSTRAINT invitation_invited_user_id_fkey;
       public               postgres    false    222    4702    228            e           2606    16628 %   invitation invitation_project_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.invitation
    ADD CONSTRAINT invitation_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.project(project_id);
 O   ALTER TABLE ONLY public.invitation DROP CONSTRAINT invitation_project_id_fkey;
       public               postgres    false    4698    222    226            f           2606    16633 &   invitation invitation_referrer_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.invitation
    ADD CONSTRAINT invitation_referrer_id_fkey FOREIGN KEY (referrer_id) REFERENCES public.user_profile(user_id);
 P   ALTER TABLE ONLY public.invitation DROP CONSTRAINT invitation_referrer_id_fkey;
       public               postgres    false    4702    228    222            g           2606    16638 (   last_download last_download_file_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.last_download
    ADD CONSTRAINT last_download_file_id_fkey FOREIGN KEY (file_id) REFERENCES public.file_data(file_data_id);
 R   ALTER TABLE ONLY public.last_download DROP CONSTRAINT last_download_file_id_fkey;
       public               postgres    false    224    218    4690            h           2606    16643 (   last_download last_download_user_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.last_download
    ADD CONSTRAINT last_download_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profile(user_id);
 R   ALTER TABLE ONLY public.last_download DROP CONSTRAINT last_download_user_id_fkey;
       public               postgres    false    224    228    4702            i           2606    16648 +   last_download last_download_version_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.last_download
    ADD CONSTRAINT last_download_version_id_fkey FOREIGN KEY (version_id) REFERENCES public.file_version(version_id);
 U   ALTER TABLE ONLY public.last_download DROP CONSTRAINT last_download_version_id_fkey;
       public               postgres    false    4692    220    224            j           2606    16653    project project_creator_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.project
    ADD CONSTRAINT project_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.user_profile(user_id);
 I   ALTER TABLE ONLY public.project DROP CONSTRAINT project_creator_id_fkey;
       public               postgres    false    226    228    4702            k           2606    16658 )   user_project user_project_project_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.user_project
    ADD CONSTRAINT user_project_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.project(project_id);
 S   ALTER TABLE ONLY public.user_project DROP CONSTRAINT user_project_project_id_fkey;
       public               postgres    false    226    4698    230            l           2606    16663 &   user_project user_project_user_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.user_project
    ADD CONSTRAINT user_project_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profile(user_id);
 P   ALTER TABLE ONLY public.user_project DROP CONSTRAINT user_project_user_id_fkey;
       public               postgres    false    4702    228    230            �      x�37M5�L34I47������ )=�      �   P   x�3�t�,*.QH��IU��S(��JM.Qp����,�L�Q(-��OL�4�2�NM��K!F�9c�Е�rY�2��=... ��9�         k   x�U��
� ��|ن�<�������D��Bقm���!0���8/�d[�
}	�!�J?m��@�P(rϫr�q��_�vSsa�}�щv�9}�_��k�K�s��3/         �   x���A
�0����)܋�M�Y� ݄Ě�������b�b��'�Ώņ�^ڻ�B��;�`��"c����TL~h���@��M���
����ϡu�O�o@�d}�lX����Yt��w�>QF"��n<�:!��ۢ��
$��s}���x�Z�5��Zf�"S֦(S����J����{8         A   x��ʹ�0��W9c�$8=����@x6]�gj]�n�6��d�l?,��Ê^�o���         }  x�m�K��0���)�/"�=w���&��R���5fn�c�9�We;��A[$!~$�D۝�A�B�S�_Ġ@z�d��W,~]/����n�#E�t@���](]�5���<R����;��N���-���f�C������
�%��y�y$((���VI�r1�gU@��c�J�%�9���G����4X�=,��@����1�F���6�L��}��Ƣ���@����
>w_
��Vy��^ Elίu�>���Xg��&&����,���5��cb�,�� �6v�+[�g��nu�u>%.��S������.�}̷>�SPLO ���E.}�ο�����xL����S�z>���wc	/]�>�HZdǸ�!���T��\      	   �  x����NI������ܭUWk�va'�!������m��]x�<�>B^lklq�l���Ֆ�����ZT˼xX>�)�.w�f����ԏ۝8�VWa�
6���4V�:����C�j~T����P�������Y�2d�ɢ� (����I��Cs�m�=���p=!���'��D��R�Y���k��k���s;����_}8p���ϳ�����.Q���,H�$!�+T��`;�T� R>̓*�T2%��%:�6(�w���F��U�X}�2_��/6C�e��p?����j-CN�rh��nC&�2AbTVJI���Jq�qJd~9ƢU�h��n@�X霱khS���ُ��r���;�Fn�A��~�t7�M���u�bb�
���\���/F{@o��4�`����E�$���7BO�d#��V���ۉ��3ޟ��̣=�Or��m^|�?l���G�&S|��HP!�.�D��E!@L��hXB�bL}��&��F٭�.���d�*);�F�󇓓���\��i�?����2J��Kg5�e�a=;�
J* �Q��Ea��b�/�u'T�zT��z����v�M5���O3g���2�oltb�wpv�9��ev�0���	\���(�蒣�:���J����+���Z9��l��*؂^�M��z턀_pˎ�[<ηy�-'������R������`z�m��d,6( ���:��\*�R3g�W�(4F~��Y��J�f%�2�舨��l��y�<�m#���hD#W�q:�9��)����Q,�(X��4q��Y��(��C&H�
"[��:��	�hh�x$�����ٜ+���'~����ʺ���o�o���O�uPN��AJɢ"
YLFO�
���@�(ed�H�'�?�,D�67�؉��Ƌ坟u?�m^>�^o���Ʒ��/�ٝ>��.�B���6�h5���s�
.;\7�eQX��F%�ᒕ�X��c�^+��oû_G�����ո�˧�+�F����8�w��34��F�b�.���HJ&n�
��n����()%�/��J����~�Om�j�\�W�6/���θ��k��:����\?���T@	E#p ��G�L��*����7����Ƒ49i��W2YA#??�m�ᜎ����ż�7[7���<.Ʃ}sq}SsEtdm�>�("_H(!����ĘY��X��k���9ԅ�W���\�Ok��ٿ�lmm��%�_         �   x�}�;n�0��Y>���"%�9A���Yz�ҭk�2�Y�?ђr����v$�x�6#�� E�\ �_�$�@ac1�k��RG��J6�emUUۨ�V]�A!�f������՛4lP}���aC�S�MM-n԰;-=�/�Q�t@�����wXɣ���Ԩt
c�Y~����h�(���\;5>!*3�o��%>��S��T��Q^ g���Џ��H��=���4}�_�m     